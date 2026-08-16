import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, ETD_DATE_COMMERCIAL, ETD_DATE_DB_ID, HANDOVER_DATE_DB_ID, HANDOVER_TO_FORWARDER } from "~/utils/config";

interface CommercialTNAPlanning {
    invoice_no: string;
    buyer_name: string;
    factory_name: string;
    template_name: string;
    exfactory_date: Date;
    added_at: Date;
    total_count: bigint;
}

export const commercialTnaPlanRouter = createTRPCRouter({
    getTnaPlanning: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<CommercialTNAPlanning[]>`
                    WITH COMMERCIAL_TNA AS (
                        SELECT
                            CTP.id,
                            FI.INVOICE_NO,
                            B.BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            CTT.TEMPLATE_NAME,
                            MIN(E.EXFACTORY_DATE) AS EXFACTORY_DATE,
                            FI.ADDED_AT
                        FROM commercial_tna_planning AS CTP
                            INNER JOIN factory_invoice AS FI ON FI.id = CTP.factory_invoice_id
                            INNER JOIN commercial_tna_templates AS CTT ON CTT.id = CTP.commercial_tna_template_id
                            INNER JOIN BUYERS AS B ON B.id = FI.buyer_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                        WHERE (
                            EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = B.id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY FI.ID, B.ID, F.ID, CTT.ID, CTP.id
                        ORDER BY ADDED_AT
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const tnaPlans = result.map(({ total_count: _, ...invoice }) => invoice);

                return { tnaPlans, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchTNAPlans: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<CommercialTNAPlanning[]>`
                    WITH COMMERCIAL_TNA AS (
                        SELECT
                            CTP.id,
                            FI.INVOICE_NO,
                            B.BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            CTT.TEMPLATE_NAME,
                            MIN(E.EXFACTORY_DATE) AS EXFACTORY_DATE,
                            FI.ADDED_AT
                        FROM commercial_tna_planning AS CTP
                            INNER JOIN factory_invoice AS FI ON FI.id = CTP.factory_invoice_id
                            INNER JOIN commercial_tna_templates AS CTT ON CTT.id = CTP.commercial_tna_template_id
                            INNER JOIN BUYERS AS B ON B.id = FI.buyer_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                        WHERE (
                            EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = B.id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            FI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR F.NAME ILIKE '%' || ${input.query} || '%'
                            OR CTT.TEMPLATE_NAME ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY FI.ID, B.ID, F.ID, CTT.ID, CTP.id
                        ORDER BY ADDED_AT DESC
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const tnaPlans = result.map(({ total_count: _, ...invoice }) => invoice);

                return { tnaPlans, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getTnaPlanById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const tnaPlansObj = await ctx.db.commercial_tna_planning.findUnique({
                    where: {
                        id: input.id
                    },
                    select: {
                        id: true,
                        factory_invoice: {
                            select: {
                                invoice_no: true
                            }
                        },
                        commercial_tna_templates: {
                            select: {
                                template_name: true,
                            }
                        },
                        commercial_tna_planning_details: {
                            orderBy: [
                                {
                                    commercial_tna_templates_actions: {
                                        serial: "asc",
                                    },
                                },
                                {
                                    plan_date: "asc",
                                },
                            ],
                            select: {
                                id: true,
                                actual_date: true,
                                plan_date: true,
                                commercial_tna_templates_actions: {
                                    select: {
                                        tna_actions: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                    }
                })

                const tnaPlans = tnaPlansObj ? {
                    id: tnaPlansObj.id,
                    factory_invoice: tnaPlansObj.factory_invoice.invoice_no,
                    tna_template: tnaPlansObj.commercial_tna_templates.template_name,
                    details: tnaPlansObj.commercial_tna_planning_details.map(d => ({
                        id: d.id,
                        plan_date: d.plan_date,
                        actual_date: d.actual_date,
                        action: d.commercial_tna_templates_actions.tna_actions.name
                    }))
                } : null;

                return tnaPlans;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTnaPlan: protectedProcedure
        .input(z.object({
            id: z.string(),
            details: z.array(z.object({
                id: z.string(),
                actual_date: z.date()
            }))
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_update;

            if(!can_add){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to update commercial TNA plans"
                })
            }
            
            try {
                return ctx.db.$transaction(async (tx) => {
                    await Promise.all(
                        input.details.map(async (items) => {
                            await tx.commercial_tna_planning_details.update({
                                where: { id: items.id },
                                data: {
                                    actual_date: items.actual_date
                                }
                            });

                            await tx.commercial_tna_planning_details_history.create({
                                data: {
                                    commercial_tna_planning_details_id: input.id,
                                    commercial_tna_planning_id: items.id,
                                    actual_date: items.actual_date
                                }
                            })
                        })
                    );

                    await tx.$executeRaw`
                        UPDATE tna_plan_details AS TPD
                            SET actual_date = CTPD.actual_date
                        FROM commercial_tna_planning_details AS CTPD,
                            commercial_tna_planning AS CTP,
                            commercial_tna_templates_actions AS CTTA,
                            factory_invoice AS FI,
                            factory_invoice_details AS FID, 
                            exfactory_shipments AS ES,
                            tna_template_actions AS TTA
                        WHERE CTP.id = CTPD.commercial_tna_planning_id
                            AND FI.id = CTP.factory_invoice_id
                            AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                            AND FID.factory_invoice_id = FI.id
                            AND ES.id = FID.exfactory_shipment_id
                            AND TPD.shipment_id = ES.shipment_details_id
                            AND TTA.id = TPD.tna_template_action_id
                            AND TTA.tna_action_id = ${ETD_DATE_DB_ID}
                            AND CTTA.tna_action_id = ${ETD_DATE_COMMERCIAL}
                            AND CTP.id = ${input.id};
                    `;
                    
                    await tx.$executeRaw`
                        UPDATE tna_plan_details AS TPD
                            SET actual_date = CTPD.actual_date
                        FROM commercial_tna_planning_details AS CTPD,
                            commercial_tna_planning AS CTP,
                            commercial_tna_templates_actions AS CTTA,
                            factory_invoice AS FI,
                            factory_invoice_details AS FID, 
                            exfactory_shipments AS ES,
                            tna_template_actions AS TTA
                        WHERE CTP.id = CTPD.commercial_tna_planning_id
                            AND FI.id = CTP.factory_invoice_id
                            AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                            AND FID.factory_invoice_id = FI.id
                            AND ES.id = FID.exfactory_shipment_id
                            AND TPD.shipment_id = ES.shipment_details_id
                            AND TTA.id = TPD.tna_template_action_id
                            AND TTA.tna_action_id = ${HANDOVER_DATE_DB_ID}
                            AND CTTA.tna_action_id = ${HANDOVER_TO_FORWARDER}
                            AND CTP.id = ${input.id};
                    `;
                })
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
})
