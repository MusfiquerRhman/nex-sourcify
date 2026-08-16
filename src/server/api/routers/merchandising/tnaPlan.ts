import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, ETD_DATE_DB_ID } from "~/utils/config";
import type { TNATemplateType, AdditionalDataType, ActionsType, EventsType } from './_types/tnaPlan';

export const tnaPlanRouter = createTRPCRouter({
    getTnaPlans: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_PLANNING]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Plans." 
                });
            }
            try {
                const result = await ctx.db.$queryRaw<TNATemplateType[]>`
                    WITH filtered AS (
                        SELECT
                            TP.ID,
                            TT.TEMPLATE_NAME AS TNA_TEMPLATE,
                            BO.REF_NO AS ORDER_REF,
                            F.NAME AS FACTORY_NAME,
                            TP.PLAN_DATE,
                            OS.STYLE
                        FROM TNA_PLANS AS TP
                            INNER JOIN TNA_TEMPLATES AS TT ON TT.ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN ORDER_STYLES AS OS ON OS.ID = TP.STYLE_ID
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = TP.ORDER_ID
                            INNER JOIN FACTORIES AS F ON F.ID = BO.FACTORY_ID
                        WHERE (
                            EXISTS (
                                SELECT 
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = BO.TEAM_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                    )
                    SELECT
                        ID,
                        TNA_TEMPLATE,
                        ORDER_REF,
                        FACTORY_NAME,
                        PLAN_DATE,
                        STYLE,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM filtered
                    ORDER BY PLAN_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const plans = result.map(({ total_count: _, ...row }) => row);

                return { plans, count: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchTnaPlans: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_PLANNING]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Plans." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<TNATemplateType[]>`
                    WITH filtered AS (
                        SELECT
                            TP.ID,
                            TT.TEMPLATE_NAME AS TNA_TEMPLATE,
                            BO.REF_NO AS ORDER_REF,
                            F.NAME AS FACTORY_NAME,
                            TP.PLAN_DATE,
                            OS.STYLE
                        FROM TNA_PLANS AS TP
                            INNER JOIN TNA_TEMPLATES AS TT ON TT.ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN ORDER_STYLES AS OS ON OS.ID = TP.STYLE_ID
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = TP.ORDER_ID
                            INNER JOIN FACTORIES AS F ON F.ID = BO.FACTORY_ID
                            LEFT JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        WHERE (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = BO.TEAM_ID
                                AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            TT.TEMPLATE_NAME ILIKE '%' || ${input.query} || '%' OR
                            BO.REF_NO ILIKE '%' || ${input.query} || '%' OR
                            F.NAME ILIKE '%' || ${input.query} || '%' OR
                            OS.STYLE ILIKE '%' || ${input.query} || '%' OR
                            SD.buyer_po ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT
                        ID,
                        TNA_TEMPLATE,
                        ORDER_REF,
                        FACTORY_NAME,
                        PLAN_DATE,
                        STYLE,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM filtered
                    GROUP BY ID, TNA_TEMPLATE, ORDER_REF, FACTORY_NAME, PLAN_DATE, STYLE
                    ORDER BY PLAN_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const plans = result.map(({ total_count: _, ...row }) => row);

                return { plans, count: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaPlanById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_PLANNING]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA Plans." 
                });
            }

            const team_member = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyer_orders: {
                            some: {
                                tna_plans: {
                                    some: { id: input.id }
                                }
                            }
                        }
                    }
                }
            });

            if(!team_member && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this TNA Plan." 
                });
            }

            try {
                const planObj = await ctx.db.tna_plans.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        tna_templates: {
                            select: {
                                id: true,
                                template_name: true,
                            },
                        },
                        buyer_orders: {
                            select: {
                                id: true,
                                ref_no: true,
                                factories: {
                                    select: {
                                        name: true,
                                    }
                                }
                            }
                        },
                        order_styles: {
                            select: {
                                id: true,
                                style: true,
                            }
                        },
                        plan_date: true,
                    },
                });

                const actions = await ctx.db.$queryRaw<ActionsType[]>`
                    SELECT 
                        TPD.id AS DB_ID,
                        SD.buyer_po AS BUYER_PO,
                        D.NAME AS DESTINATION_NAME,
                        TA.name AS ACTION_NAME,
                        CASE 
                            WHEN COALESCE(TBA.action_id, 0) = ${ETD_DATE_DB_ID} 
                                THEN SD.ETD_DATE - TTA.DAYS
                            ELSE SD.HANDOVER_DATE - TTA.DAYS
                        END AS PLAN_DATE,
                        TPD.REVISE_DATE AS REVISE_DATE,
                        TPD.ACTUAL_DATE AS ACTUAL_DATE
                    FROM tna_plans AS TP
                        INNER JOIN tna_plan_details AS TPD ON TPD.tna_plan_id = TP.id
                        INNER JOIN shipment_details AS SD ON SD.ID = TPD.shipment_id
                        INNER JOIN tna_template_actions AS TTA ON TTA.id = TPD.tna_template_action_id
                        INNER JOIN tna_actions AS TA ON TA.id = TTA.tna_action_id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.ID = OS.order_id
                        LEFT JOIN tna_base_actions AS TBA ON TBA.buyer_id = BO.buyer_id
                        INNER JOIN destinations AS D ON D.ID = SD.destination_id
                    WHERE TP.ID = ${input.id}
                    ORDER BY SD.serial, TTA.serial;
                `;
            
                const plan = planObj ? {
                    id: planObj.id,
                    template_id: planObj.tna_templates.id,
                    template_name: planObj.tna_templates.template_name,
                    factory_name: planObj.buyer_orders.factories?.name ?? '',
                    order_id: planObj.buyer_orders.id,
                    ref_no: planObj.buyer_orders.ref_no,
                    style_id: planObj.order_styles.id,
                    style: planObj.order_styles.style,
                    plan_date: planObj.plan_date,
                    actions: actions.map(action => ({
                        db_id: action.db_id,
                        buyer_po: action.buyer_po,
                        destination_name: action.destination_name,
                        action_name: action.action_name,
                        plan_date: action.plan_date,
                        revise_date: action.revise_date,
                        actual_date: action.actual_date, 
                    }))
                } : null;

                return plan;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    createTNAPlan: protectedProcedure
        .input(
            z.object({
                template_id: z.string(),
                style_id: z.string(),
                plan_date: z.date(),
                order_id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_create = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if (!can_create) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create TNA Plans." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newPlan = await tx.tna_plans.create({
                        data: {
                            tna_template_id: input.template_id,
                            style_id: input.style_id,
                            plan_date: input.plan_date,
                            order_id: input.order_id,
                        },
                    });

                    await tx.tna_plan_history.create({
                        data: {
                            tna_plan_id: newPlan.id,
                            tna_template_id: input.template_id,
                            style_id: input.style_id,
                            plan_date: input.plan_date,
                            order_id: input.order_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        }
                    });

                    // Populate TNA_PLAN_DETAILS based on the template actions and shipment details
                    await tx.$queryRaw`
                        INSERT INTO TNA_PLAN_DETAILS (
                            TNA_PLAN_ID,
                            TNA_TEMPLATE_ACTION_ID,
                            SHIPMENT_ID
                        )
                        SELECT 
                            TP.ID,
                            TTA.ID,
                            SD.ID
                        FROM TNA_PLANS AS TP
                            INNER JOIN ORDER_STYLES AS OS ON OS.ID = TP.STYLE_ID
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ORDER_STYLE_ID = OS.ID
                            INNER JOIN TNA_TEMPLATES AS TT ON TT.ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN TNA_TEMPLATE_ACTIONS AS TTA ON TTA.TNA_TEMPLATE_ID = TP.TNA_TEMPLATE_ID
                            INNER JOIN TNA_ACTIONS AS TA ON TA.ID = TTA.TNA_ACTION_ID
                        WHERE TP.ID = ${newPlan.id};
                    `;

                    return newPlan;
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrdersForPlanning: protectedProcedure
        .query(async ({ ctx }) => {
            const can_add = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add TNA Plans." 
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ id: string; ref_no: string }[]>`
                    SELECT 
                        O.ID, O.REF_NO
                    FROM BUYER_ORDERS AS O
                        INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = O.id
                        WHERE (
                            EXISTS ( -- ADMIN
                                SELECT 
                                    TRUE
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- TEAM MEMBER
                                SELECT 
                                    TRUE
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = O.TEAM_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND EXISTS ( -- At least one style pending
                            SELECT 
                                TRUE
                            FROM ORDER_STYLES AS OS
                            WHERE OS.ORDER_ID = O.ID
                                AND NOT EXISTS (
                                    SELECT 
                                        TRUE
                                    FROM TNA_PLANS AS TP
                                    WHERE TP.STYLE_ID = OS.ID
                                )
                        )
                        AND FO.approval_status = 2
                        ORDER BY O.ADDED_AT DESC;
                `;

                return orders;
            }
            catch (error) {
                            handlePrismaError(error);
            }
        }),

    getStyleForTNAPlanningByOrderId: protectedProcedure
        .input(z.object({ order_id: z.string() }))
        .query(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add styles." 
                });
            }

            try {
                const styles = await ctx.db.$queryRaw<{ id: string; style: string }[]>`
                    SELECT 
                        OS.ID, OS.STYLE
                    FROM ORDER_STYLES AS OS
                        INNER JOIN BUYER_ORDERS AS BO ON OS.ORDER_ID = BO.ID
                    WHERE (
                        EXISTS ( -- TEAM MEMBER
                            SELECT 
                                TRUE 
                            FROM TEAM_MEMBERS AS TM 
                                INNER JOIN USERS AS U ON U.ID = TM.USER_ID
                            WHERE TM.TEAM_ID = BO.TEAM_ID
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                        OR EXISTS ( -- ADMIN
                            SELECT 
                                TRUE 
                            FROM USERS AS U
                            WHERE U.DEPARTMENT_ID = 5
                                AND LEVEL_ID = 5
                                AND U.ID = ${ctx.user.id}
                        )
                    )
                    AND NOT EXISTS ( -- Style do not have a TNA Plan
                        SELECT 
                            TRUE
                        FROM TNA_PLANS AS TP
                        WHERE TP.STYLE_ID = OS.ID
                    )
                    AND BO.ID = ${input.order_id}
                    ORDER BY BO.ADDED_AT DESC;
                `;
                
                return styles;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTnaPlan: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.TNA_PLANNING]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete TNA Plans." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const existingTnaPlanDetails = await tx.tna_plan_details.findMany({
                        where: { tna_plan_id: input.id },
                    });

                    await tx.tna_plan_details.deleteMany({
                        where: { tna_plan_id: input.id },
                    });

                    await tx.tna_plan_details_history.createMany({
                        data: existingTnaPlanDetails.map(detail => ({
                            tna_plan_id: detail.tna_plan_id,
                            tna_plan_details_id: detail.id,
                            tna_template_action_id: detail.tna_template_action_id,
                            shipment_id: detail.shipment_id,
                            revise_date: detail.revise_date,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }))
                    });

                    const existingPlan = await tx.tna_plans.delete({
                        where: { id: input.id },
                    });

                    await tx.tna_plan_history.create({
                        data: {
                            tna_plan_id: existingPlan.id,
                            tna_template_id: existingPlan.tna_template_id,
                            style_id: existingPlan.style_id,
                            plan_date: existingPlan.plan_date,
                            order_id: existingPlan.order_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });

                    return existingPlan;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getSeasonAndFactoryByOrderId: protectedProcedure
        .input(z.object({ order_id: z.string() }))
        .query(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.TNA_PLANNING]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view season and factory information." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<AdditionalDataType[]>`
                    SELECT
                        S.SEASON_NAME AS SEASON_NAME,
                        F.NAME AS FACTORY_NAME,
                        B.BUYER_NAME AS BUYER_NAME,
                        BB.BRAND AS BRAND_NAME,
                        BD.DEPARTMENT AS DEPARTMENT_NAME
                    FROM BUYER_ORDERS AS BO
                        INNER JOIN SEASONS AS S ON S.ID = BO.SEASON_ID
                        INNER JOIN FACTORIES AS F ON F.ID = BO.FACTORY_ID
                        INNER JOIN BUYERS AS B ON B.ID = BO.BUYER_ID
                        INNER JOIN BUYER_DEPARTMENTS AS BD ON BO.DEPARTMENT_ID = BD.ID
                        INNER JOIN BUYER_BRANDS AS BB ON BO.BRAND_ID = BB.ID
                    WHERE BO.ID = ${input.order_id}
                    LIMIT 1;
                `;
                return result[0];
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTnaPlan: protectedProcedure
        .input(
            z.array(z.object({
                id: z.string(),
                revise_date: z.date().optional(),
                actual_date: z.date().optional(),
            }))
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.TNA_PLANNING]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update TNA Plans." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedActions = [];

                    for (const action of input) {
                        const updatedAction = await tx.tna_plan_details.update({
                            where: { id: action.id },
                            data: { 
                                revise_date: action.revise_date,
                                actual_date: action.actual_date
                            },
                        });
                        updatedActions.push(updatedAction);

                        await tx.tna_plan_details_history.create({
                            data: {
                                tna_plan_id: updatedAction.tna_plan_id,
                                tna_plan_details_id: updatedAction.id,
                                tna_template_action_id: updatedAction.tna_template_action_id,
                                shipment_id: updatedAction.shipment_id,
                                revise_date: updatedAction.revise_date,
                                actual_date: updatedAction.actual_date,
                                action_type: actions.UPDATE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    return updatedActions;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getEventsForTnaUpdate: protectedProcedure
        .input(z.object({
            from_date: z.string(),
            to_date: z.string(),
            actionIds: z.array(z.number()).min(1, "At least one action must be selected"),
         }))
        .query(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.TNA_EVENTS]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view TNA events." 
                });
            }

            try {
                const events = await ctx.db.$queryRaw<EventsType[]>`
                    SELECT 
                        TPD.id AS id,
                        BO.ref_no AS order_ref,
                        OS.style AS style,
                        SD.BUYER_PO AS po,
                        TT.TEMPLATE_NAME AS tna_templates,
                        TA.NAME AS action_name,
                        CASE 
                            WHEN COALESCE(TBA.action_id, 0) = ${ETD_DATE_DB_ID}
                                THEN SD.ETD_DATE - TTA.DAYS
                            ELSE SD.HANDOVER_DATE - TTA.DAYS
                        END AS PLAN_DATE,
                        TPD.REVISE_DATE AS revise_date,
                        TPD.ACTUAL_DATE AS actual_date,
                        B.BUYER_NAME AS buyer_name,
                        F.NAME AS factory_name,
                        D.NAME AS destination_name
                    FROM tna_plan_details AS TPD 
                        INNER JOIN shipment_details AS SD ON SD.id = TPD.shipment_id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                        INNER JOIN destinations AS D ON D.id = SD.destination_id
                        INNER JOIN tna_plans AS TP ON TP.id = TPD.tna_plan_id
                        INNER JOIN tna_templates AS TT ON TT.ID = TP.tna_template_id
                        INNER JOIN tna_template_actions AS TTA ON TTA.ID = TPD.tna_template_action_id
                        INNER JOIN tna_actions AS TA ON TA.ID = TTA.tna_action_id
                        INNER JOIN FACTORIES AS F ON F.ID = BO.FACTORY_ID
                        INNER JOIN BUYERS AS B ON B.ID = BO.buyer_id
                        LEFT JOIN tna_base_actions AS TBA ON TBA.buyer_id = BO.buyer_id
                    WHERE (
                            CASE 
                                WHEN COALESCE(TBA.action_id, 0) = ${ETD_DATE_DB_ID}
                                    THEN SD.ETD_DATE - TTA.DAYS
                                ELSE SD.HANDOVER_DATE - TTA.DAYS
                            END 
                        ) BETWEEN ${input.from_date} AND ${input.to_date}
                        AND (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = BO.TEAM_ID
                                AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND TPD.ACTUAL_DATE IS NULL
                        AND TA.ID IN (${Prisma.join(input.actionIds)})
                    ORDER BY PLAN_DATE ASC;
                `;
                return events;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTnaEvents: protectedProcedure
        .input(z.array(z.object({
            id: z.string(),
            revise_date: z.date().optional(),
            actual_date: z.date().optional(),
        })))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.TNA_EVENTS]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update TNA events."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedEvents = await Promise.all(
                        input.map(async (event) => {
                            return tx.tna_plan_details.update({
                                where: {
                                    id: event.id,
                                },
                                data: {
                                    revise_date: event.revise_date,
                                    actual_date: event.actual_date,
                                },
                            });
                        })
                    );

                    await Promise.all(
                        input.map(async (event) => {
                            await tx.tna_plan_details_history.create({
                                data: {
                                    tna_plan_id: event.id,
                                    tna_plan_details_id: event.id,
                                    revise_date: event.revise_date,
                                    actual_date: event.actual_date,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });
                        })
                    );

                    return updatedEvents;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
});