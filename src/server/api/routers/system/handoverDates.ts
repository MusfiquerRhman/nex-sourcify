import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const handoverDatesRouter = createTRPCRouter({
    getHandoverDates: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.HANDOVER_DATES]?.can_view;

        if (!can_view) {
            throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to view handover dates." });
        }

        const handoverDatesObj = await ctx.db.handover_dates.findMany({
            take: input.limit,
            skip: input.offset,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                buyers: {
                    select: {
                        id: true,
                        buyer_name: true,
                    }
                },
                buffer: true,
            }
        });

        const total = await ctx.db.handover_dates.count();

        const handoverDates = handoverDatesObj.map(hd => ({
            id: hd.id,
            buyer_name: hd.buyers.buyer_name,
            buffer: hd.buffer,
        }));

        return {handoverDates, total};
    }),

    getHandoverDateById: protectedProcedure
        .input(z.object({
            id: z.number().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.HANDOVER_DATES]?.can_view;

            if (!can_view) {
                throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to view handover dates." });
            }

            const handoverDateObj = await ctx.db.handover_dates.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    buyers: {
                        select: {
                            id: true,
                            buyer_name: true,
                        }
                    },
                    buffer: true,
                }
            });

            const handoverDate = handoverDateObj ? {
                id: handoverDateObj.id,
                buyer_id: handoverDateObj.buyers.id,
                buyer_name: handoverDateObj.buyers.buyer_name,
                buffer: handoverDateObj.buffer,
            } : null;
            return handoverDate;
        }),
        
    addHandoverDate: protectedProcedure
        .input(z.object({
            buyer_id: z.number().min(1),
            buffer: z.number().min(0),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.HANDOVER_DATES]?.can_add;

            if (!can_add) {
                throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to add handover dates." });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newHandoverDate = await tx.handover_dates.create({
                        data: {
                            buyer_id: input.buyer_id,
                            buffer: input.buffer,
                        },
                    });

                    await tx.handover_dates_history.create({
                        data: {
                            handover_date_id: newHandoverDate.id,
                            buyer_id: newHandoverDate.buyer_id,
                            buffer: newHandoverDate.buffer,
                            action_type: 'ADDED',
                            action_by: ctx.user.id,
                        },
                    })

                    return newHandoverDate;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }

        }),

    updateHandoverDate: protectedProcedure
        .input(z.object({
            id: z.number().min(1),
            buffer: z.number().min(0),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.HANDOVER_DATES]?.can_update;

            if (!can_edit) {
                throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to edit handover dates." });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedHandoverDate =  await tx.handover_dates.update({
                        where: { id: input.id },
                        data: {
                            buffer: input.buffer,
                        },
                    });

                    await tx.handover_dates_history.create({
                        data: {
                            handover_date_id: input.id,
                            buyer_id: updatedHandoverDate.buyer_id,
                            buffer: input.buffer,
                            action_type: 'UPDATE',
                            action_by: ctx.user.id,
                        },
                    })

                    return updatedHandoverDate;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }

        }),

    deleteHandoverDate: protectedProcedure
        .input(z.object({
            id: z.number().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.HANDOVER_DATES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to delete handover dates." });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deletedHandoverDate = await tx.handover_dates.delete({
                        where: { id: input.id },
                    });

                    await tx.handover_dates_history.create({
                        data: {
                            handover_date_id: deletedHandoverDate.id,
                            buyer_id: deletedHandoverDate.buyer_id,
                            buffer: deletedHandoverDate.buffer,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    })
                    
                    return deletedHandoverDate;
                });

            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchHandoverDates: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.HANDOVER_DATES]?.can_view;

            if (!can_view) {
                throw new TRPCError({  code: "FORBIDDEN",  message: "You do not have permission to view handover dates." });
            }

            const handoverDatesObj = await ctx.db.handover_dates.findMany({
                where: {
                    OR: [
                        { buyers: { buyer_name: { contains: input.query, mode: 'insensitive' }}},
                        { buffer: { equals: Number(input.query) ?? -1 }},
                    ],
                },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    buyers: {
                        select: {
                            id: true,
                            buyer_name: true,
                        }
                    },
                    buffer: true,
                }
            });

            const total = await ctx.db.handover_dates.count({
                where: {
                    OR: [
                        { buyers: { buyer_name: { contains: input.query, mode: 'insensitive' }}},
                        { buffer: { equals: Number(input.query) ?? -1 }},
                    ],
                },
            });

            const handoverDates = handoverDatesObj.map(hd => ({
                id: hd.id,
                buyer_name: hd.buyers.buyer_name,
                buffer: hd.buffer,
            }));

            return {handoverDates, total};
        }),

    getHandoverDateBufferByBuyerId: protectedProcedure
        .input(z.object({
            buyer_id: z.number().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const handoverDateObj = await ctx.db.handover_dates.findUnique({
                where: { buyer_id: input.buyer_id },
                select: {
                    id: true,
                    buffer: true,
                }
            });
            const handoverDate = handoverDateObj ?? {buffer: 7};
            return handoverDate;
        }),
});
