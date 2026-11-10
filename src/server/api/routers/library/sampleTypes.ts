import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

const nameSchema = z.string().trim().min(2, "Sample type name must be at least 2 characters long").max(50);

export const sampleTypesRouter = createTRPCRouter({
    getAllSampleType: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.sample_types.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });
    }),

    getSampleTypes: protectedProcedure
        .input(z.object({
            limit: z.number().int().min(1).default(15),
            offset: z.number().int().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SAMPLE_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view sample types.",
                });
            }

            const sampleTypes = await ctx.db.sample_types.findMany({
                select: { id: true, name: true },
                orderBy: [{ added_at: "desc" }, { id: "desc" }],
                take: input.limit,
                skip: input.offset,
            });
            const total = await ctx.db.sample_types.count();

            return { sampleTypes, total };
        }),

    getSampleTypeById: protectedProcedure
        .input(z.object({ id: z.number().int().min(1) }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SAMPLE_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view sample types.",
                });
            }

            const sampleType = await ctx.db.sample_types.findUnique({
                where: { id: input.id },
                select: { id: true, name: true },
            });

            if (!sampleType) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Sample type not found." });
            }

            return sampleType;
        }),

    addSampleType: protectedProcedure
        .input(z.object({ name: nameSchema }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.SAMPLE_TYPES]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add sample types.",
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const created = await tx.sample_types.create({ data: { name: input.name } });

                    await tx.sample_types_history.create({
                        data: {
                            sample_types_id: created.id,
                            name: created.name,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    return created;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteSampleType: protectedProcedure
        .input(z.object({ id: z.number().int().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SAMPLE_TYPES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete sample types.",
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const deleted = await tx.sample_types.delete({ where: { id: input.id } });

                    await tx.sample_types_history.create({
                        data: {
                            sample_types_id: deleted.id,
                            name: deleted.name,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return deleted;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateSampleType: protectedProcedure
        .input(z.object({ id: z.number().int().min(1), name: nameSchema }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.SAMPLE_TYPES]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update sample types.",
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const updated = await tx.sample_types.update({
                        where: { id: input.id },
                        data: { name: input.name },
                    });

                    await tx.sample_types_history.create({
                        data: {
                            sample_types_id: updated.id,
                            name: updated.name,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    return updated;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchSampleTypes: protectedProcedure
        .input(z.object({
            query: z.string().trim().min(1),
            limit: z.number().int().min(1).default(15),
            offset: z.number().int().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SAMPLE_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view sample types.",
                });
            }

            const sampleTypes = await ctx.db.sample_types.findMany({
                where: { name: { contains: input.query, mode: "insensitive" } },
                select: { id: true, name: true },
                orderBy: [{ name: "asc" }, { id: "asc" }],
                take: input.limit,
                skip: input.offset,
            });
            const total = await ctx.db.sample_types.count({
                where: { name: { contains: input.query, mode: "insensitive" } },
            });

            return { sampleTypes, total };
        }),
});
