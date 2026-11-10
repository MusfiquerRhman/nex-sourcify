import { randomUUID } from "crypto";
import { mkdir, open, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCContext } from "~/server/api/trpc";
import { getPPMeetingOrderAccess } from "~/server/_utils/ppMeetingAccess";
import { MAX_SIZE_KB } from "~/utils/images/imageCompression";
import { ppMeetingImageFilenameSchema, ppMeetingImageSectionSchema, type PPMeetingImage, type PPMeetingImageSection } from "~/utils/images/ppMeetingImages";
import { isValidImage } from "~/utils/images/validations";
import { m } from "~/utils/moduleMap";

export const runtime = 'nodejs';

const uploadSchema = z.object({
    meetingId: z.string().uuid(),
    section: ppMeetingImageSectionSchema,
});

const deleteSchema = uploadSchema.extend({ imageId: z.string().uuid() });

const getUploadContext = async (req: Request) => {
    const ctx = await createTRPCContext({ headers: req.headers });

    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token.' });
    if (!ctx.permissions[m.PP_MEETING]?.can_update) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update Pre Production Meetings.' });
    }

    return { ...ctx, user: ctx.user };
};

const checkMeetingAccess = async (ctx: Awaited<ReturnType<typeof getUploadContext>>, meetingId: string) => {
    const meeting = await ctx.db.pre_production_meeting.findFirst({
        where: { id: meetingId, order_styles: { buyer_orders: getPPMeetingOrderAccess(ctx.user) } },
        select: { id: true, attendance_list_photo: true },
    });

    if (!meeting) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pre Production Meeting not found.' });

    return meeting;
};

const getStoredImagePath = (section: PPMeetingImageSection, url: string) => {
    const prefix = `/uploads/pp_meeting/${section}/`;
    if (!url.startsWith(prefix)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid image path.' });

    const filename = ppMeetingImageFilenameSchema.parse(url.slice(prefix.length));
    return path.join(process.cwd(), 'public', 'pp_meeting', section, filename);
};

const isMissingFile = (error: unknown) => {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
};

const errorResponse = (error: unknown) => {
    if (error instanceof z.ZodError) {
        return Response.json({ success: false, message: 'Invalid meeting, image, or section.' }, { status: 400 });
    }

    if (error instanceof TRPCError) {
        const statuses: Partial<Record<TRPCError['code'], number>> = { UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, BAD_REQUEST: 400, CONFLICT: 409 };
        const status = statuses[error.code] ?? 500;
        return Response.json({ success: false, message: error.message }, { status });
    }

    console.error('[PP meeting images] Request failed:', error);
    return Response.json({ success: false, message: 'Failed to update PP meeting images. Please try again.' }, { status: 500 });
};

export async function POST(req: Request) {
    const writtenPaths: string[] = [];
    let savedImages = false;

    try {
        const ctx = await getUploadContext(req);
        const formData = await req.formData().catch(() => {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Send images as multipart form data.' });
        });
        const { meetingId, section } = uploadSchema.parse({ meetingId: formData.get('meetingId'), section: formData.get('section') });
        const meeting = await checkMeetingAccess(ctx, meetingId);

        const files = formData.getAll('files');
        if (!files.length) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select at least one image to upload.' });
        if (section === 'attendance_lists' && files.length !== 1) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload one attendance list photo at a time.' });
        }

        const uploads = [];

        for (const file of files) {
            if (!(file instanceof File) || !isValidImage(file) || file.type !== 'image/jpeg') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload valid images processed by the photo uploader.' });
            }

            if (file.size === 0 || file.size > MAX_SIZE_KB * 1024) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: `Each compressed image must be between 1 byte and ${MAX_SIZE_KB} KB.` });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid or corrupted image: ${file.name}` });
            }

            const id = randomUUID();
            uploads.push({ id, buffer, url: `/uploads/pp_meeting/${section}/${id}.jpg` });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'pp_meeting', section);
        await mkdir(uploadDir, { recursive: true });

        for (const upload of uploads) {
            const filePath = path.join(uploadDir, `${upload.id}.jpg`);
            const file = await open(filePath, 'wx');
            writtenPaths.push(filePath);

            try {
                await file.writeFile(upload.buffer);
            } finally {
                await file.close();
            }
        }

        const data = uploads.map((upload) => ({ id: upload.id, pre_production_meeting_id: meetingId, url: upload.url }));
        let images: PPMeetingImage[];

        if (section === 'attendance_lists') {
            const upload = uploads[0];
            if (!upload) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select an attendance list photo to upload.' });

            const result = await ctx.db.pre_production_meeting.updateMany({
                where: { id: meetingId, attendance_list_photo: meeting.attendance_list_photo },
                data: { attendance_list_photo: upload.url },
            });

            if (result.count !== 1) {
                throw new TRPCError({ code: 'CONFLICT', message: 'The attendance photo has changed. Refresh the meeting and try again.' });
            }

            images = [{ id: upload.id, url: upload.url }];
            savedImages = true;

            if (meeting.attendance_list_photo) {
                try {
                    await unlink(getStoredImagePath(section, meeting.attendance_list_photo));
                } catch (error) {
                    if (!isMissingFile(error)) console.error('[PP meeting images] Failed to remove previous attendance photo:', error);
                }
            }
        } else {
            images = section === 'pps_views'
                ? await ctx.db.pre_production_meeting_pps_images.createManyAndReturn({ data, select: { id: true, url: true } })
                : await ctx.db.pre_production_meeting_size_set_images.createManyAndReturn({ data, select: { id: true, url: true } });
            savedImages = true;
        }

        return Response.json({ success: true, images }, { status: 201 });
    } catch (error) {
        if (!savedImages) {
            await Promise.all(writtenPaths.map(async (filePath) => {
                try {
                    await unlink(filePath);
                } catch (cleanupError) {
                    if (!isMissingFile(cleanupError)) console.error('[PP meeting images] Failed to clean up upload:', cleanupError);
                }
            }));
        }

        return errorResponse(error);
    }
}

export async function DELETE(req: Request) {
    try {
        const ctx = await getUploadContext(req);
        const { meetingId, section, imageId } = deleteSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
        const meeting = await checkMeetingAccess(ctx, meetingId);

        const where = { id: imageId, pre_production_meeting_id: meetingId };
        let image: PPMeetingImage | null;

        if (section === 'attendance_lists') {
            image = meeting.attendance_list_photo === `/uploads/pp_meeting/${section}/${imageId}.jpg`
                ? { id: imageId, url: meeting.attendance_list_photo }
                : null;
        } else if (section === 'pps_views') {
            image = await ctx.db.pre_production_meeting_pps_images.findFirst({ where });
        } else {
            image = await ctx.db.pre_production_meeting_size_set_images.findFirst({ where });
        }

        if (!image) throw new TRPCError({ code: 'NOT_FOUND', message: 'PP meeting image not found.' });

        const filePath = getStoredImagePath(section, image.url);
        let backup: Buffer | undefined;
        let removedFile = false;

        try {
            backup = await readFile(filePath);
        } catch (error) {
            if (!isMissingFile(error)) throw error;
        }

        try {
            await ctx.db.$transaction(async (tx) => {
                if (section === 'attendance_lists') {
                    const result = await tx.pre_production_meeting.updateMany({
                        where: { id: meetingId, attendance_list_photo: image.url },
                        data: { attendance_list_photo: null },
                    });

                    if (result.count !== 1) {
                        throw new TRPCError({ code: 'CONFLICT', message: 'The attendance photo has changed. Refresh the meeting and try again.' });
                    }
                } else if (section === 'pps_views') {
                    await tx.pre_production_meeting_pps_images.delete({ where });
                } else {
                    await tx.pre_production_meeting_size_set_images.delete({ where });
                }

                try {
                    await unlink(filePath);
                    removedFile = true;
                } catch (error) {
                    if (!isMissingFile(error)) throw error;
                }
            });
        } catch (error) {
            if (removedFile && backup) await writeFile(filePath, backup, { flag: 'wx' });
            throw error;
        }

        return Response.json({ success: true, message: 'Photo deleted successfully.' });
    } catch (error) {
        return errorResponse(error);
    }
}
