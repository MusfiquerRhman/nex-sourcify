import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, HANDOVER_DATE_DB_ID } from "~/utils/config";

type TNATemplateReturnType = {
    id: string; 
    template_name: string; 
    buyer_name: string; 
    team_name: string
}

export const tnaTemplatesRouter = createTRPCRouter({
    createTnaTemplate: protectedProcedure
        .input(z.object({
            template_name: z.string().min(2),
            buyer_id: z.number(),
            team_id: z.number(),
            actions: z.array(z.object({
                serial: z.number(),
                action_id: z.number(),
                days: z.number(),
                alert_before: z.number(),
             })).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const can_add = ctx.permissions[m.TNA_TEMPLATES]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create TNA Templates."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newTemplate = await tx.tna_templates.create({
                        data: {
                            team_id: input.team_id,
                            template_name: input.template_name,
                            buyer_id: input.buyer_id,
                        },
                    });

                    await tx.tna_templates_history.create({
                        data: {
                            tna_template_id: newTemplate.id,
                            template_name: input.template_name,
                            team_id: input.team_id,
                            buyer_id: input.buyer_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.actions && input.actions.length > 0) {
                        const actionsData = input.actions.map((action) => ({
                            tna_template_id: newTemplate.id,
                            tna_action_id: action.action_id,
                            days: action.days,
                            alert_before: action.alert_before,
                            serial: action.serial,
                        }));

                        await tx.tna_template_actions.createMany({
                            data: actionsData,
                        });

                        await tx.tna_template_actions_history.createMany({
                            data: actionsData.map(action => ({
                                ...action,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id, 
                            })),    
                        });
                    }

                    return newTemplate;
                }, {timeout: 30000})
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaTemplates: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_TEMPLATES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const rows = await ctx.db.$queryRaw<(TNATemplateReturnType & { total_count: bigint })[]>`
                    SELECT
                        TT.ID,
                        TT.TEMPLATE_NAME,
                        B.BUYER_NAME,
                        T.TEAM_NAME,
                        COUNT(*) OVER() AS total_count
                    FROM TNA_TEMPLATES AS TT
                    INNER JOIN BUYERS AS B ON TT.BUYER_ID = B.ID
                    INNER JOIN TEAMS AS T ON TT.TEAM_ID = T.ID
                    WHERE (
                        EXISTS (
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = ${ctx.user.id}::uuid
                            AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                            AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM
                            WHERE TM.TEAM_ID = T.ID
                            AND TM.USER_ID = ${ctx.user.id}::uuid
                        )
                    )
                    ORDER BY TT.ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

                const templates = rows.map(({ total_count: _, ...row }) => row);

                return {
                    templates,
                    count: totalCount,
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaTemplateById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_TEMPLATES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            const isTeamMember = await ctx.db.tna_templates.findFirst({
                where: {
                    id: input.id,
                    teams: {
                        team_members: {
                            some: {
                                user_id: ctx.user.id,
                            }
                        }
                    }
                }            
            });

            if(!isTeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this TNA Template."
                });
            }

            try {
                const templateObj = await ctx.db.tna_templates.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        template_name: true,
                        buyers: {
                            select: {
                                id: true,
                                buyer_name: true,
                            }                        
                        },
                        teams: {
                            select: {
                                id: true,
                                team_name: true,
                            }
                        },
                        tna_template_actions: {
                            select: {
                                id: true,
                                tna_action_id: true,
                                days: true,
                                alert_before: true,
                                serial: true,
                            },
                            orderBy: {
                                serial: 'asc',
                            }
                        }
                    },
                });

                const template = templateObj ? {
                    id: templateObj.id,
                    template_name: templateObj.template_name,
                    buyer_id: templateObj.buyers?.id,
                    team_id: templateObj.teams?.id,
                    buyer_name: templateObj.buyers?.buyer_name,
                    team_name: templateObj.teams?.team_name,
                    actions: templateObj.tna_template_actions.map(action => ({
                        id: action.id,
                        tna_action_id: action.tna_action_id,
                        days: action.days,
                        alert_before: action.alert_before,
                        serial: action.serial,
                    }))
                } : null;

                return template;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTnaTemplate: protectedProcedure
        .input(z.object({
            id: z.string(),
            template_name: z.string().min(2),
            buyer_id: z.number(),
            team_id: z.number(),
            actions: z.array(z.object({
                id: z.string().optional(),
                serial: z.number(),
                action_id: z.number(),
                days: z.number(),
                alert_before: z.number(),
             })).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const can_edit = ctx.permissions[m.TNA_TEMPLATES]?.can_update;

            if(!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to edit TNA Templates."
                });
            }

            const team_member = await ctx.db.team_members.findFirst({
                where: {
                    team_id: input.team_id,
                    user_id: ctx.user.id,
                },
            });

            if(!team_member && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to edit TNA Templates for this team."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedTemplate = await tx.tna_templates.update({
                        where: { id: input.id },
                        data: {
                            template_name: input.template_name,
                            buyer_id: input.buyer_id,
                            team_id: input.team_id,
                        },
                    });

                    await tx.tna_templates_history.create({
                        data: {
                            tna_template_id: updatedTemplate.id,
                            template_name: input.template_name,
                            team_id: input.team_id,
                            buyer_id: input.buyer_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.actions) {
                        for(const action of input.actions) {
                            if(action.id) {
                                await tx.tna_template_actions.update({
                                    where: { id: action.id },
                                    data: {
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                    },
                                });

                                await tx.tna_template_actions_history.create({
                                    data: {
                                        tna_template_action_id: action.id,
                                        tna_template_id: updatedTemplate.id,
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                        action_type: actions.UPDATE,
                                        action_by: ctx.user.id,
                                    },
                                });
                            } else {
                                await tx.tna_template_actions.create({
                                    data: {
                                        tna_template_id: updatedTemplate.id,
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                    },
                                });

                                await tx.tna_template_actions_history.create({
                                    data: {
                                        tna_template_id: updatedTemplate.id,
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                        action_type: actions.ADDED,
                                        action_by: ctx.user.id,
                                    },
                                });
                            }
                        }
                    }

                    return updatedTemplate;
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteTnaTemplate: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const can_delete = ctx.permissions[m.TNA_TEMPLATES]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete TNA Templates."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const tnaTemplateActions = await tx.tna_template_actions.findMany({
                        where: { tna_template_id: input.id },
                    });

                    for(const action of tnaTemplateActions) {
                        await tx.tna_template_actions_history.create({
                            data: {
                                tna_template_action_id: action.id,
                                tna_template_id: action.tna_template_id,
                                tna_action_id: action.tna_action_id,
                                days: action.days,
                                alert_before: action.alert_before,
                                serial: action.serial,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });

                        await tx.tna_template_actions.delete({
                            where: { id: action.id },
                        });
                    }

                    const deletedTemplate = await tx.tna_templates.delete({
                        where: { id: input.id },
                    });

                    await tx.tna_templates_history.create({
                        data: {
                            tna_template_id: deletedTemplate.id,
                            template_name: deletedTemplate.template_name,
                            team_id: deletedTemplate.team_id,
                            buyer_id: deletedTemplate.buyer_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return deletedTemplate;
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
    
    searchTnaTemplates: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number().default(15),
            offset: z.number().default(0),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_TEMPLATES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const rows = await ctx.db.$queryRaw<(TNATemplateReturnType & { total_count: bigint })[]>`
                    SELECT
                        TT.ID,
                        TT.TEMPLATE_NAME,
                        B.BUYER_NAME,
                        T.TEAM_NAME,
                        COUNT(*) OVER() AS total_count
                    FROM TNA_TEMPLATES AS TT
                    INNER JOIN BUYERS AS B ON TT.BUYER_ID = B.ID
                    INNER JOIN TEAMS AS T ON TT.TEAM_ID = T.ID
                    WHERE (
                        EXISTS (
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = ${ctx.user.id}::uuid
                            AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                            AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM
                            WHERE TM.TEAM_ID = T.ID
                            AND TM.USER_ID = ${ctx.user.id}::uuid
                        )
                    )
                    AND (
                        B.BUYER_NAME ILIKE ${`%${input.query}%`}
                        OR TT.TEMPLATE_NAME ILIKE ${`%${input.query}%`}
                        OR T.TEAM_NAME ILIKE ${`%${input.query}%`}
                    )
                    ORDER BY TT.ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

                const templates = rows.map(({ total_count: _, ...row }) => row);

                return {
                    templates,
                    count: totalCount,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBaseTnaActionByBuyers: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_TEMPLATES]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const baseActionsObj = await ctx.db.tna_base_actions.findUnique({
                    where: { buyer_id: input.buyer_id },
                    select: {
                        action_id: true,
                    }
                });

                const baseAction = baseActionsObj?.action_id ?? HANDOVER_DATE_DB_ID; // default to Handover date if no base action found

                return baseAction;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTnaTemplateAction: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.TNA_TEMPLATES]?.can_delete;    

            if(!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete TNA Template actions."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deletedAction = await tx.tna_template_actions.delete({
                        where: { id: input.id },
                    });

                    await tx.tna_template_actions_history.create({
                        data: {
                            tna_template_action_id: deletedAction.id,
                            tna_template_id: deletedAction.tna_template_id,
                            tna_action_id: deletedAction.tna_action_id,
                            days: deletedAction.days,
                            alert_before: deletedAction.alert_before,
                            serial: deletedAction.serial,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return deletedAction;
                }, {timeout: 30000})
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAllTemplatesForPlanning: protectedProcedure
        .input(z.object({
            order_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if(!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add TNA Plans."
                });
            }

            try {
                const templates = await ctx.db.$queryRaw<{ id: string; template_name: string }[]>`
                    SELECT
                        TT.ID, TT.TEMPLATE_NAME
                    FROM TNA_TEMPLATES AS TT
                        INNER JOIN BUYER_ORDERS AS BO 
                            ON BO.BUYER_ID = TT.BUYER_ID
                            AND BO.TEAM_ID = TT.TEAM_ID
                    WHERE BO.ID = ${input.order_id};
                `;

                return templates;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});