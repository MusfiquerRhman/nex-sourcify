import { actions, type Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { sampleChecklistSections } from "../../utils/sampleChecklist";
import { sampleChecklistImagesInclude } from "./sampleChecklist";
import { getSampleChecklistImagePath } from "./sampleChecklistImageStorage";

type DeleteSampleChecklistInput = {
    id: string;
    checklistAccess: Prisma.sample_check_listWhereInput;
    actionBy: string;
};

type RemovedImage = { filePath: string; buffer: Buffer };

const historySelect = {
    with_order: true,
    style_no_manual: true,
    sample_check_date: true,
    buyer_id: true,
    factory_id: true,
    style_id: true,
    color_id: true,
    sample_type: true,
    sample_size: true,
    sample_quantity: true,
    fabric: true,
    trims_accessories: true,
    workmanship: true,
    fitting: true,
    measurement: true,
    pattern: true,
    print_emb: true,
    wash: true,
    main_label: true,
    main_label_position: true,
    size_label: true,
    size_label_position: true,
    care_label: true,
    care_label_position: true,
    risk_area: true,
} satisfies Prisma.sample_check_listSelect;

const isMissingFile = (error: unknown) => {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
};

export const deleteSampleChecklist = async (db: PrismaClient, input: DeleteSampleChecklistInput) => {
    const { id, checklistAccess, actionBy } = input;
    const removedImages: RemovedImage[] = [];

    try {
        return await db.$transaction(
            async (tx) => {
                // Serialize deletion with parent updates and image foreign-key inserts.
                await tx.$queryRaw`SELECT id FROM sample_check_list WHERE id = ${id}::uuid FOR UPDATE`;

                const checklist = await tx.sample_check_list.findFirst({
                    where: { ...checklistAccess, id },
                    select: historySelect,
                });
                if (!checklist) throw new TRPCError({ code: "NOT_FOUND", message: "Sample Checklist not found." });

                const images = await tx.sample_check_list.findUniqueOrThrow({ where: { id }, select: sampleChecklistImagesInclude });
                const imageDeletes: Prisma.sample_check_listUpdateInput = {};
                for (const section of sampleChecklistSections) imageDeletes[section.relation] = { deleteMany: {} };

                await tx.sample_check_list_history.create({
                    data: { ...checklist, action_by: actionBy, action_type: actions.DELETE },
                });
                await tx.sample_check_list.update({ where: { id }, data: imageDeletes, select: { id: true } });

                for (const section of sampleChecklistSections) {
                    for (const image of images[section.relation]) {
                        const filePath = getSampleChecklistImagePath(section.name, image.id);

                        let buffer: Buffer;
                        try {
                            buffer = await readFile(filePath);
                            await unlink(filePath);
                        } catch (error) {
                            if (isMissingFile(error)) continue;
                            throw error;
                        }
                        removedImages.push({ filePath, buffer });
                    }
                }

                await tx.sample_check_list.delete({ where: { id } });
                return id;
            },
            { timeout: 30000 },
        );
    } catch (error) {
        // Database failures also roll back files removed before the transaction committed.
        const restored = await Promise.allSettled(removedImages.map((image) => writeFile(image.filePath, image.buffer, { flag: "wx" })));
        const restorationErrors: unknown[] = [];
        for (const result of restored) {
            if (result.status === "rejected") restorationErrors.push(result.reason);
        }
        if (restorationErrors.length) {
            throw new AggregateError([error, ...restorationErrors], "Sample Checklist deletion failed and some photos could not be restored.");
        }
        throw error;
    }
};
