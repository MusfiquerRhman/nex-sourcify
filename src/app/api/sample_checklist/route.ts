import { randomUUID } from "crypto";
import { mkdir, open, readFile, unlink } from "fs/promises";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { deleteSampleChecklistImage } from "~/server/_utils/deleteSampleChecklistImage";
import { getSampleChecklistAccess } from "~/server/_utils/sampleChecklistAccess";
import { getSampleChecklistImageDirectory, getSampleChecklistImagePath } from "~/server/_utils/sampleChecklistImageStorage";
import { createTRPCContext } from "~/server/api/trpc";
import { MAX_SIZE_KB } from "~/utils/images/imageCompression";
import { isValidImage } from "~/utils/images/validations";
import { m } from "~/utils/moduleMap";
import { getSampleChecklistImageUrl, sampleChecklistImageSectionSchema, sampleChecklistSections, type SampleChecklistImageSection } from "~/utils/sampleChecklist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadSchema = z.object({ checklistId: z.string().uuid(), section: sampleChecklistImageSectionSchema });
const imageSchema = uploadSchema.extend({ imageId: z.string().uuid() });

const getImageContext = async (req: Request, permission: "can_view" | "can_update") => {
    const ctx = await createTRPCContext({ headers: req.headers });
    if (!ctx.user?.is_active) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token." });
    const permissions = ctx.permissions[m.SAMPLE_CHECKLIST];
    const canAccess = permission === "can_view" ? permissions?.can_view === true || permissions?.can_update === true : permissions?.can_update;
    if (!canAccess) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access these Sample Checklist images." });

    return { ...ctx, user: ctx.user };
};

const getImageRelation = (section: SampleChecklistImageSection) => {
    const config = sampleChecklistSections.find((item) => item.name === section);
    if (!config) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image section." });
    return config.relation;
};

const errorResponse = (error: unknown) => {
    if (error instanceof z.ZodError) {
        return Response.json({ success: false, message: "Invalid checklist, image, or section." }, { status: 400 });
    }
    if (error instanceof TRPCError) {
        const statuses: Partial<Record<TRPCError["code"], number>> = { UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, BAD_REQUEST: 400 };
        return Response.json({ success: false, message: error.message }, { status: statuses[error.code] ?? 500 });
    }

    console.error("[Sample checklist images] Request failed:", error);
    return Response.json({ success: false, message: "Failed to access Sample Checklist images. Please try again." }, { status: 500 });
};

export async function POST(req: Request) {
    const writtenPaths: string[] = [];
    let savedImages = false;

    try {
        const ctx = await getImageContext(req, "can_update");
        const formData = await req.formData().catch(() => {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Send images as multipart form data." });
        });
        const { checklistId, section } = uploadSchema.parse({ checklistId: formData.get("checklistId"), section: formData.get("section") });
        const where = { ...getSampleChecklistAccess(ctx.user), id: checklistId };
        const checklist = await ctx.db.sample_check_list.findFirst({ where, select: { id: true } });
        if (!checklist) throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist not found." });

        const files = formData.getAll("files");
        if (!files.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Select at least one image to upload." });
        const uploads = [];

        for (const file of files) {
            if (!(file instanceof File) || !isValidImage(file) || file.type !== "image/jpeg") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Upload valid images processed by the photo uploader." });
            }
            if (file.size === 0 || file.size > MAX_SIZE_KB * 1024) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Each compressed image must be between 1 byte and ${MAX_SIZE_KB} KB.` });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid or corrupted image: ${file.name}` });
            }

            const id = randomUUID();
            uploads.push({ id, buffer, url: getSampleChecklistImageUrl(section, id, checklistId) });
        }

        const uploadDir = getSampleChecklistImageDirectory(section);
        await mkdir(uploadDir, { recursive: true });
        for (const upload of uploads) {
            const filePath = getSampleChecklistImagePath(section, upload.id);
            const file = await open(filePath, "wx");
            writtenPaths.push(filePath);
            try {
                await file.writeFile(upload.buffer);
            } finally {
                await file.close();
            }
        }

        const images = uploads.map((upload) => ({ id: upload.id, url: upload.url }));
        await ctx.db.sample_check_list.update({
            where,
            data: { [getImageRelation(section)]: { create: images } },
            select: { id: true },
        });
        savedImages = true;

        return Response.json({ success: true, images }, { status: 201 });
    } catch (error) {
        // Roll back only files created by this failed request. Saved photos are never deleted here.
        if (!savedImages) {
            await Promise.all(
                writtenPaths.map(async (filePath) => {
                    try {
                        await unlink(filePath);
                    } catch (cleanupError) {
                        console.error("[Sample checklist images] Failed to roll back new upload:", cleanupError);
                    }
                }),
            );
        }
        return errorResponse(error);
    }
}

export async function GET(req: Request) {
    try {
        const ctx = await getImageContext(req, "can_view");
        const { checklistId, section, imageId } = imageSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
        const checklist = await ctx.db.sample_check_list.findFirst({
            where: {
                ...getSampleChecklistAccess(ctx.user),
                id: checklistId,
                [getImageRelation(section)]: { some: { id: imageId } },
            },
            select: { id: true },
        });
        if (!checklist) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist image not found." });
        }

        const file = await readFile(getSampleChecklistImagePath(section, imageId));
        return new Response(new Uint8Array(file), {
            headers: {
                "Content-Type": "image/jpeg",
                "Content-Length": String(file.length),
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
            return Response.json({ success: false, message: "Image file not found." }, { status: 404 });
        }
        return errorResponse(error);
    }
}

export async function DELETE(req: Request) {
    try {
        const ctx = await getImageContext(req, "can_update");
        const input = imageSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
        await deleteSampleChecklistImage(ctx.db, { ...input, checklistAccess: getSampleChecklistAccess(ctx.user) });

        return Response.json({ success: true, message: "Photo deleted successfully." });
    } catch (error) {
        return errorResponse(error);
    }
}
