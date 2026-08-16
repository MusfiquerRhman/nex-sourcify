import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

type TNATemplateReturnType = {
    id: string; 
    template_name: string; 
    buyer_name: string; 
    term: string;
}

export const commercialTnaTemplatesRouter = createTRPCRouter({
    createTnaTemplate: protectedProcedure
        .input(z.object({
            template_name: z.string().min(2),
            buyer_id: z.number(),
            term_id: z.number(),
            actions: z.array(z.object({
                serial: z.number(),
                action_id: z.number(),
                days: z.number(),
                alert_before: z.number(),
             })).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const can_add = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create TNA Templates."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newTemplate = await tx.commercial_tna_templates.create({
                        data: {
                            template_name: input.template_name,
                            buyer_id: input.buyer_id,
                            payment_term_id: input.term_id,
                        },
                    });

                    await tx.commercial_tna_templates_history.create({
                        data: {
                            commercial_tna_templates_id: newTemplate.id,
                            template_name: input.template_name,
                            buyer_id: input.buyer_id,
                            payment_term_id: input.term_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.actions && input.actions.length > 0) {
                        const actionsData = input.actions.map((action) => ({
                            commercial_tna_template_id: newTemplate.id,
                            tna_action_id: action.action_id,
                            days: action.days,
                            alert_before: action.alert_before,
                            serial: action.serial,
                        }));

                        await tx.commercial_tna_templates_actions.createMany({
                            data: actionsData,
                        });

                        await tx.commercial_tna_templates_actions_history.createMany({
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
            const can_view = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const result = await ctx.db.$queryRaw<(TNATemplateReturnType & { total_count: bigint })[]>`
                    WITH COMMERCIAL_TNA_TEMPLATES AS (
                        SELECT
                            TT.ID,
                            TT.TEMPLATE_NAME,
                            B.BUYER_NAME,
                            CONCAT(T.NAME, ' ', PT.tenor, ' ', PT.term_description) AS TERM
                        FROM COMMERCIAL_TNA_TEMPLATES AS TT
                        INNER JOIN BUYERS AS B ON TT.BUYER_ID = B.ID
                        INNER JOIN PAYMENT_TERMS AS PT ON TT.PAYMENT_TERM_ID = PT.ID
                        INNER JOIN TERMS AS T ON T.ID = PT.term_id
                        ORDER BY TT.ADDED_AT DESC
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA_TEMPLATES
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;


                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const templates = result.map(({ total_count: _, ...invoice }) => invoice);

                return {
                    templates,
                    count: total,
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaTemplateById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const templateObj = await ctx.db.commercial_tna_templates.findUnique({
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
                        buyer_payment_term: {
                            select: {
                                id: true,
                                payment_terms: {
                                    select: { 
                                        id: true,
                                        term_description: true,
                                        tenor: true,
                                        terms: {
                                            select: { id: true, name: true }
                                        }
                                    }
                                }
                            }
                        },
                        commercial_tna_templates_actions: {
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
                    buyer_name: templateObj.buyers?.buyer_name,
                    term_id: templateObj.buyer_payment_term?.id,
                    term: `${templateObj?.buyer_payment_term?.payment_terms?.terms?.name} - ${templateObj?.buyer_payment_term?.payment_terms?.tenor} ${templateObj?.buyer_payment_term?.payment_terms?.term_description}`,
                    actions: templateObj.commercial_tna_templates_actions.map(action => ({
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
            actions: z.array(z.object({
                id: z.string().optional(),
                serial: z.number(),
                action_id: z.number(),
                days: z.number(),
                alert_before: z.number(),
             })).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const can_edit = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_update;

            if(!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to edit TNA Templates."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedTemplate = await tx.commercial_tna_templates.update({
                        where: { id: input.id },
                        data: {
                            template_name: input.template_name,
                        },
                    });

                    await tx.commercial_tna_templates_history.create({
                        data: {
                            commercial_tna_templates_id: updatedTemplate.id,
                            template_name: input.template_name,
                            buyer_id: updatedTemplate.buyer_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.actions) {
                        for(const action of input.actions) {
                            if(action.id) {
                                await tx.commercial_tna_templates_actions.update({
                                    where: { id: action.id },
                                    data: {
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                    },
                                });

                                await tx.commercial_tna_templates_actions_history.create({
                                    data: {
                                        commercial_tna_templates_actions_id: action.id,
                                        commercial_tna_template_id: updatedTemplate.id,
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                        action_type: actions.UPDATE,
                                        action_by: ctx.user.id,
                                    },
                                });
                            } else {
                                await tx.commercial_tna_templates_actions.create({
                                    data: {
                                        commercial_tna_template_id: updatedTemplate.id,
                                        tna_action_id: action.action_id,
                                        days: action.days,
                                        alert_before: action.alert_before,
                                        serial: action.serial,
                                    },
                                });

                                await tx.commercial_tna_templates_actions_history.create({
                                    data: {
                                        commercial_tna_templates_actions_id: updatedTemplate.id,
                                        commercial_tna_template_id: updatedTemplate.id,
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
            const can_delete = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete TNA Templates."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const tnaTemplateActions = await tx.commercial_tna_templates_actions.findMany({
                        where: { commercial_tna_template_id: input.id },
                    });

                    for(const action of tnaTemplateActions) {
                        await tx.commercial_tna_templates_actions_history.create({
                            data: {
                                commercial_tna_templates_actions_id: action.id,
                                commercial_tna_template_id: action.commercial_tna_template_id,
                                tna_action_id: action.tna_action_id,
                                days: action.days,
                                alert_before: action.alert_before,
                                serial: action.serial,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });

                        await tx.commercial_tna_templates_actions.delete({
                            where: { id: action.id },
                        });
                    }

                    const deletedTemplate = await tx.commercial_tna_templates.delete({
                        where: { id: input.id },
                    });

                    await tx.commercial_tna_templates_history.create({
                        data: {
                            commercial_tna_templates_id: deletedTemplate.id,
                            template_name: deletedTemplate.template_name,
                            buyer_id: deletedTemplate.buyer_id,
                            payment_term_id: deletedTemplate.payment_term_id,
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
            const can_view = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Templates."
                });
            }

            try {
                const rows = await ctx.db.$queryRaw<(TNATemplateReturnType & { total_count: bigint })[]>`
                    WITH COMMERCIAL_TNA_TEMPLATES AS (
                        SELECT
                            TT.ID,
                            TT.TEMPLATE_NAME,
                            B.BUYER_NAME,
                            CONCAT(T.NAME, ' ', PT.tenor, ' ', PT.term_description) AS TERM
                        FROM COMMERCIAL_TNA_TEMPLATES AS TT
                        INNER JOIN BUYERS AS B ON TT.BUYER_ID = B.ID
                        INNER JOIN PAYMENT_TERMS AS PT ON TT.PAYMENT_TERM_ID = PT.ID
                        INNER JOIN TERMS AS T ON T.ID = PT.term_id
                        WHERE (
                            B.BUYER_NAME ILIKE ${`%${input.query}%`}
                            OR TT.TEMPLATE_NAME ILIKE ${`%${input.query}%`}
                        )
                        ORDER BY TT.ADDED_AT DESC
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA_TEMPLATES
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

    deleteTnaTemplateAction: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_delete;    

            if(!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete TNA Template actions."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deletedAction = await tx.commercial_tna_templates_actions.delete({
                        where: { id: input.id },
                    });

                    await tx.commercial_tna_templates_actions_history.create({
                        data: {
                            commercial_tna_templates_actions_id: deletedAction.id,
                            commercial_tna_template_id: deletedAction.commercial_tna_template_id,
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
            const can_add = ctx.permissions[m.TNA_TEMPLATES_COMMERCIAL]?.can_add;

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
                    FROM COMMERCIAL_TNA_TEMPLATES AS TT
                        INNER JOIN BUYER_ORDERS AS BO ON BO.BUYER_ID = TT.BUYER_ID AND BO.TEAM_ID = TT.TEAM_ID
                    WHERE BO.ID = ${input.order_id};
                `;

                return templates;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBuyerPaymentTerms: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const paymentTerms = await ctx.db.$queryRaw<{ id: number; term_description: string }[]>`
                SELECT
                    PT.ID,
                    CONCAT(T.NAME, ' ', PT.tenor, ' ', PT.term_description) AS term_description
                FROM buyer_payment_term AS BPT
                    INNER JOIN PAYMENT_TERMS AS PT ON BPT.payment_term_id = PT.id
                    INNER JOIN TERMS AS T ON T.id = PT.term_id
                WHERE BPT.buyer_id = ${input.buyer_id}
                AND NOT EXISTS (
                    SELECT 1
                    FROM commercial_tna_templates AS CTP
                    WHERE CTP.PAYMENT_TERM_ID = PT.ID AND CTP.BUYER_ID = BPT.buyer_id
                );
            `;

            return paymentTerms;
        }),
})