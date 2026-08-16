import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const tnaActionsRouter = createTRPCRouter({
    getTnaActions: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_ACTIONS]?.can_view ?? false;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA actions." 
                });
            }

            const tnaActionsObj = await ctx.db.tna_actions.findMany({
                select: {
                    id: true,
                    name: true,
                    departments: {
                        select: { id: true, name: true }
                    },
                    lead_time: true,
                    alert_before: true,
                },
                orderBy: { added_at: 'desc' },
                skip: input.offset,
                take: input.limit,
            });

            const total = await ctx.db.tna_actions.count();

            const tnaActions = tnaActionsObj.map(action => ({
                ...action,
                department_id: action.departments?.id,
                department_name: action.departments?.name,
            }));

            return { tnaActions, total };
        }),

    getTnaActionById: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_ACTIONS]?.can_view ?? false;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA actions." 
                });
            }

            const tnaAction = await ctx.db.tna_actions.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    departments: {
                        select: { id: true, name: true }
                    },
                    lead_time: true,
                    alert_before: true,
                },
            });


            return {
                ...tnaAction,
                department_id: tnaAction?.departments?.id,
                department_name: tnaAction?.departments?.name,
            };
        }),

    addTnaAction: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(255),
                department_id: z.number().min(1),
                lead_time: z.number().min(0),
                alert_before: z.number().min(0),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.TNA_ACTIONS]?.can_add ?? false;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add TNA actions." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const tnaAction = await tx.tna_actions.create({
                        data: {
                            name: input.name.trim(),
                            department_id: input.department_id,
                            lead_time: input.lead_time,
                            alert_before: input.alert_before,
                        },
                    });

                    await tx.tna_actions_history.create({
                        data: {
                            tna_action_id: tnaAction.id,
                            name: tnaAction.name.trim(),
                            department_id: tnaAction.department_id,
                            lead_time: tnaAction.lead_time,
                            alert_before: tnaAction.alert_before,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTnaAction: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.TNA_ACTIONS]?.can_delete ?? false;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete TNA actions." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const tnaAction = await tx.tna_actions.delete({
                        where: { id: input.id },
                    });

                    await tx.tna_actions_history.create({
                        data: {
                            tna_action_id: tnaAction.id,
                            name: tnaAction.name,
                            department_id: tnaAction.department_id,
                            lead_time: tnaAction.lead_time,
                            alert_before: tnaAction.alert_before,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    updateTnaAction: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
                name: z.string().min(1).max(255),
                department_id: z.number().min(1),
                lead_time: z.number().min(0),
                alert_before: z.number().min(0),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.TNA_ACTIONS]?.can_update ?? false;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update TNA actions." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.tna_actions_history.create({
                        data: {
                            tna_action_id: input.id,
                            name: input.name.trim(),
                            department_id: input.department_id,
                            lead_time: input.lead_time,
                            alert_before: input.alert_before,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const updatedTnaAction = await tx.tna_actions.update({
                        where: { id: input.id },
                        data: {
                            name: input.name.trim(),
                            department_id: input.department_id,
                            lead_time: input.lead_time,
                            alert_before: input.alert_before,
                        },
                    });

                    return updatedTnaAction;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchTnaActions: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_ACTIONS]?.can_view ?? false;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA actions." 
                });
            }

            const tnaActionsObj = await ctx.db.tna_actions.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { departments: { name: { contains: input.query, mode: "insensitive" } } },
                        { lead_time: isNaN(Number(input.query)) ? undefined : Number(input.query) },
                        { alert_before: isNaN(Number(input.query)) ? undefined : Number(input.query) },
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    departments: {
                        select: { id: true, name: true }
                    },
                    lead_time: true,
                    alert_before: true,
                },
                skip: input.offset,
                take: input.limit,
            });

            const total = await ctx.db.tna_actions.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { departments: { name: { contains: input.query, mode: "insensitive" } } },
                        { lead_time: isNaN(Number(input.query)) ? undefined : Number(input.query) },
                        { alert_before: isNaN(Number(input.query)) ? undefined : Number(input.query) },
                    ]
                }
            });

            const tnaActions = tnaActionsObj.map(action => ({
                ...action,
                department_id: action.departments?.id,
                department_name: action.departments?.name,
            }));

            return { tnaActions, total };
        }),

    getAllTnaActions: protectedProcedure
        .input(
            z.object({
                department_id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const tnaActions = await ctx.db.tna_actions.findMany({
                select: {
                    id: true,
                    name: true,
                },
                where: {
                    department_id: input.department_id,
                },
                orderBy: { name: 'asc' },
            });
            return tnaActions;
        }),
});