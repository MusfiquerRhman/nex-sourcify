import type { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { sampleChecklistSections, type SampleChecklistImageSection } from "../../utils/sampleChecklist";
import { getSampleChecklistImagePath } from "./sampleChecklistImageStorage";

type DeleteSampleChecklistImageInput = {
    checklistId: string;
    section: SampleChecklistImageSection;
    imageId: string;
    checklistAccess: Prisma.sample_check_listWhereInput;
};

export const deleteSampleChecklistImage = async (db: PrismaClient, input: DeleteSampleChecklistImageInput) => {
    const { checklistId, section, imageId, checklistAccess } = input;
    const config = sampleChecklistSections.find((item) => item.name === section);
    if (!config) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image section." });
    const filePath = getSampleChecklistImagePath(section, imageId);
    let removedImage: Buffer | undefined;

    try {
        return await db.$transaction(async (tx) => {
            // Serialize photo deletion with checklist deletion and other photo changes.
            await tx.$queryRaw`SELECT id FROM sample_check_list WHERE id = ${checklistId}::uuid FOR UPDATE`;

            const checklist = await tx.sample_check_list.findFirst({
                where: {
                    ...checklistAccess,
                    id: checklistId,
                    [config.relation]: { some: { id: imageId } },
                },
                select: { id: true },
            });
            if (!checklist) throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist image not found." });

            await tx.sample_check_list.update({
                where: { id: checklistId },
                data: { [config.relation]: { delete: { id: imageId } } },
                select: { id: true },
            });

            try {
                const buffer = await readFile(filePath);
                await unlink(filePath);
                removedImage = buffer;
            } catch (error) {
                if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")) throw error;
            }

            return imageId;
        }, { timeout: 30000 });
    } catch (error) {
        if (removedImage) {
            try {
                await writeFile(filePath, removedImage, { flag: "wx" });
            } catch (restorationError) {
                throw new AggregateError([error, restorationError], "Photo deletion failed and the photo could not be restored.");
            }
        }
        throw error;
    }
};
