import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const tnaBaseActionRouter = createTRPCRouter({
    createTnaBaseAction: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            tna_action_id: z.number(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.TNA_BASE_ACTION]?.can_add;
            
            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to add TNA Base Actions." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newTnaBaseAction = await tx.tna_base_actions.create({
                        data: {
                            buyer_id: input.buyer_id,
                            action_id: input.tna_action_id,
                        },
                    });

                    await tx.tna_base_actions_history.create({
                        data: {
                            tna_base_action_id: newTnaBaseAction.id,
                            buyer_id: input.buyer_id,
                            action_id: input.tna_action_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    return newTnaBaseAction;
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTnaBaseAction: protectedProcedure
        .input(z.object({
            id: z.string(),
            buyer_id: z.string(),
            tna_action_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.TNA_BASE_ACTION]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to update TNA Base Actions." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedTnaBaseAction = await tx.tna_base_actions.update({
                        where: { id: input.id },
                        data: {
                            buyer_id: parseInt(input.buyer_id),
                            action_id: parseInt(input.tna_action_id),
                        },
                    });

                    await tx.tna_base_actions_history.create({
                        data: {
                            tna_base_action_id: updatedTnaBaseAction.id,
                            buyer_id: parseInt(input.buyer_id),
                            action_id: parseInt(input.tna_action_id),
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    return updatedTnaBaseAction;
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAllTnaBaseActions: protectedProcedure
        .input(z.object({
            limit: z.number().optional(),
            offset: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_BASE_ACTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to view TNA Base Actions." 
                });
            }

            try {
                const tnaBaseActionsObj = await ctx.db.tna_base_actions.findMany({
                    select: {
                        id: true,
                        buyers: {
                            select: {
                                buyer_name: true,
                                id: true,
                            }
                        },
                        tna_actions: {
                            select: {
                                name: true,
                                id: true,
                            }
                        }
                    },
                    skip: input.offset,
                    take: input.limit,
                    orderBy: { added_at: 'desc' },
                });

                const tnaBaseActions = tnaBaseActionsObj.map((t) => ({
                    id: t.id,
                    buyer_name: t.buyers.buyer_name,
                    tna_action_name: t.tna_actions.name,
                }));

                const count = await ctx.db.tna_base_actions.count();

                return {tnaBaseActions, total: count, };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchTnaBaseActions: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number().optional(),
            offset: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_BASE_ACTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to view TNA Base Actions." 
                });
            }

            try {
                const tnaBaseActionsObj = await ctx.db.tna_base_actions.findMany({
                    where: {
                        OR: [
                            { buyers: { buyer_name: { contains: input.query, mode: 'insensitive' } } },
                            { tna_actions: { name: { contains: input.query, mode: 'insensitive' } } },
                        ],
                    },
                    select: {
                        id: true,
                        buyers: {
                            select: {
                                buyer_name: true,
                                id: true,
                            }
                        },
                        tna_actions: {
                            select: {
                                name: true,
                                id: true,
                            }
                        }
                    },
                    skip: input.offset,
                    take: input.limit,
                    orderBy: { added_at: 'desc' },
                });

                const tnaBaseActions = tnaBaseActionsObj.map((t) => ({
                    id: t.id,
                    buyer_id: t.buyers.id,
                    buyer_name: t.buyers.buyer_name,
                    tna_action_id: t.tna_actions.id,
                    tna_action_name: t.tna_actions.name,
                }));

                const count = await ctx.db.tna_base_actions.count({
                    where: {
                        OR: [
                            { buyers: { buyer_name: { contains: input.query, mode: 'insensitive' } } },
                            { tna_actions: { name: { contains: input.query, mode: 'insensitive' } } },
                        ],
                    },
                });
                return {tnaBaseActions, total: count, };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTnaBaseAction: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.TNA_BASE_ACTION]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete TNA Base Actions." 
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const deletedTnaBaseAction = await tx.tna_base_actions.delete({
                        where: { id: input.id },
                    });

                    await tx.tna_base_actions_history.create({
                        data: {
                            tna_base_action_id: deletedTnaBaseAction.id,
                            buyer_id: deletedTnaBaseAction.buyer_id,
                            action_id: deletedTnaBaseAction.action_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaBaseActionById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_BASE_ACTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to view TNA Base Actions." 
                });
            }

            try {
                return await ctx.db.tna_base_actions.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        buyer_id: true,
                        action_id: true,
                    }
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBuyersForTnaBaseAction: protectedProcedure
        .input(z.string().optional())
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_BASE_ACTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to view TNA Base Actions." 
                });
            }

            try {
                if (input) {
                    const buyer = await ctx.db.tna_base_actions.findUnique({
                        where: { id: input },
                        select: {
                            buyer_id: true,
                            buyers: {
                                select: {
                                    id: true,
                                    buyer_name: true,
                                }
                            }
                        }
                    });

                    return buyer ? [
                        { id: buyer.buyers.id, buyer_name: buyer.buyers.buyer_name }
                    ] : [];
                }
                else {
                    return await ctx.db.$queryRaw<{id: string, buyer_name: string}[]>`
                        SELECT 
                            ID, BUYER_NAME
                        FROM buyers
                        WHERE ID NOT IN (
                            SELECT buyer_id FROM tna_base_actions
                        )
                        ORDER BY BUYER_NAME ASC;
                    `;
                }
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

});
   