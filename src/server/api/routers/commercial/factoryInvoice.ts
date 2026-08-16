import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma, shipment_modes } from "@prisma/client";
import { ACTUAL_EXFACTORY_DATE, ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, FACTORY_INVOICE } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { FactoryInvoiceListItem, ScLcListItem, ExfactoryShipmentDetails, FactoryInvoicePDFTableItem } from './_types/factoryInvoice';

export const factoryInvoiceRouter = createTRPCRouter({
    getFactoryInvoiceList: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view factory invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<FactoryInvoiceListItem[]>`
                    WITH FACTORY_INVOICES AS (
                        SELECT
                            FI.ID,
                            F.NAME AS FACTORY_NAME,
                            B.BUYER_NAME AS BUYER_NAME,
                            FI.INVOICE_NO,
                            FI.INVOICE_DATE,
                            SUM(
                                CASE 
                                    WHEN FSD.TRANSFER_RATE <> 0
                                        THEN ES.delivery_quantity * FSD.TRANSFER_RATE
                                    ELSE ES.delivery_quantity * FSD.FACTORY_RATE
                                END
                            ) AS VALUE,
                            C.SYMBOL,
                            FI.ADDED_AT
                        FROM FACTORY_INVOICE AS FI
                        INNER JOIN factory_invoice_details AS FID ON FI.id = FID.factory_invoice_id
                        INNER JOIN EXFACTORY_SHIPMENTS AS ES ON ES.ID = FID.exfactory_shipment_id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = ES.shipment_details_id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN FACTORIES AS F ON F.id = FI.factory_id
                        INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                        INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                        INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                        INNER JOIN CURRENCIES AS C ON C.id = FO.currency_id
                        INNER JOIN BUYERS AS B ON B.id = BO.buyer_id
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
                                WHERE T.BUYER_ID = BO.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY FI.ID, F.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FACTORY_INVOICES
                    ORDER BY ADDED_AT DESC, INVOICE_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const factoryInvoices = result.map(({ total_count: _,  value, symbol, ...invoice}) => (
                    { ...invoice, value: currencyFormatter(value, symbol) })
                );

                return { factoryInvoices, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchFactoryInvoices: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view factory invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<FactoryInvoiceListItem[]>`
                    WITH FACTORY_INVOICES AS (
                        SELECT
                            FI.ID,
                            F.NAME AS FACTORY_NAME,
                            B.BUYER_NAME AS BUYER_NAME,
                            FI.INVOICE_NO,
                            FI.INVOICE_DATE,
                            SUM(
                                CASE 
                                    WHEN FSD.TRANSFER_RATE <> 0
                                        THEN ES.delivery_quantity * FSD.TRANSFER_RATE
                                    ELSE ES.delivery_quantity * FSD.FACTORY_RATE
                                END
                            ) AS VALUE,
                            C.SYMBOL,
                            FI.ADDED_AT
                        FROM FACTORY_INVOICE AS FI
                        INNER JOIN factory_invoice_details AS FID ON FI.id = FID.factory_invoice_id
                        INNER JOIN EXFACTORY_SHIPMENTS AS ES ON ES.ID = FID.exfactory_shipment_id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = ES.shipment_details_id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN FACTORIES AS F ON F.id = FI.factory_id
                        INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                        INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                        INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                        INNER JOIN CURRENCIES AS C ON C.id = FO.currency_id
                        INNER JOIN BUYERS AS B ON B.id = BO.buyer_id
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
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = BO.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            F.NAME ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR FI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR OS.STYLE ILIKE '%' || ${input.query} || '%'
                            OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY FI.ID, F.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FACTORY_INVOICES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const factoryInvoices = result.map(({ total_count: _,  value, symbol, ...lc}) => (
                    { ...lc, value: currencyFormatter(value, symbol) })
                );

                return { factoryInvoices, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteFactoryInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FACTORY_INVOICE]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to delete factory invoices." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const tnaPlan = await tx.commercial_tna_planning.findUnique({    
                        where: { factory_invoice_id: input.id },
                    });

                    if (tnaPlan) {
                        await tx.commercial_tna_planning_details.deleteMany({
                            where: { commercial_tna_planning_id: tnaPlan.id },
                        });

                        await tx.commercial_tna_planning.delete({
                            where: { id: tnaPlan.id },
                        })
                    }

                    // Check if the invoice exists
                    const details = await tx.factory_invoice_details.findMany({
                        where: { factory_invoice_id: input.id },
                    });

                    for (const detail of details) {
                        await tx.factory_invoice_details.delete({
                            where: { id: detail.id },
                        });

                        await tx.factory_invoice_details_history.create({
                            data: {
                                factory_invoice_details_id: detail.id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                                factory_invoice_id: detail.factory_invoice_id,
                                exfactory_shipment_id: detail.exfactory_shipment_id,
                            }
                        })
                    }

                    const deleted = await tx.factory_invoice.delete({
                        where: { id: input.id },
                    });

                    await tx.factory_invoice_history.create({
                        data: {
                            factory_invoice_id: deleted.id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            invoice_no: deleted.invoice_no,
                            factory_id: deleted.factory_id,
                            sales_contract_id: deleted.sales_contract_id,
                            lc_id: deleted.lc_id,
                            discount: deleted.discount,
                            remarks: deleted.remarks,
                            term_id: deleted.term_id,
                            invoice_date: deleted.invoice_date,
                        }
                    });
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addFactoryInvoice: protectedProcedure
        .input(z.object({
            factory_id: z.number(),
            term_id: z.number(),
            buyer_id: z.number(),
            lc_sc_id: z.string(),
            invoice_no: z.string(),
            invoice_date: z.date(),
            shipment_mode: z.string().optional(),
            port_of_loading: z.number().optional(),
            freight_term_id: z.number().optional(),
            discount: z.number().optional(),
            userConsigneeIds: z.array(z.number()).optional(),
            notifyPartyIds: z.array(z.number()).optional(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                exfactory_shipment_id: z.string(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.FACTORY_INVOICE]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to add factory invoices." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const terms = await ctx.db.terms.findUnique({
                        where: { id: input.term_id },
                        select: { name: true },
                    });

                    if (!terms) {
                        throw new TRPCError({ 
                            code: 'NOT_FOUND', 
                            message: "Terms not found." 
                        });
                    }

                    const isTT = terms.name.toLowerCase() === 'tt';

                    const createdInvoice = await tx.factory_invoice.create({
                        data: {
                            factory_id: input.factory_id,
                            term_id: input.term_id,
                            buyer_id: input.buyer_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            invoice_no: input.invoice_no,
                            invoice_date: input.invoice_date,
                            remarks: input.remarks,
                            port_of_loading: input.port_of_loading,
                            freight_term_id: input.freight_term_id,
                            shipment_mode: input.shipment_mode as shipment_modes,
                            discount: input.discount,
                        }
                    });

                    for (const detail of input.details ?? []) {
                        const addedDetails = await tx.factory_invoice_details.create({
                            data: {
                                factory_invoice_id: createdInvoice.id,
                                exfactory_shipment_id: detail.exfactory_shipment_id,
                            }
                        });

                        await tx.factory_invoice_details_history.create({
                            data: {
                                factory_invoice_details_id: addedDetails.id,
                                factory_invoice_id: createdInvoice.id,
                                exfactory_shipment_id: detail.exfactory_shipment_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            }
                        })
                    }

                    await tx.factory_invoice_history.create({
                        data: {
                            factory_invoice_id: createdInvoice.id,
                            action_type: actions.ADDED,
                            buyer_id: input.buyer_id,
                            action_by: ctx.user.id,
                            invoice_no: createdInvoice.invoice_no,
                            factory_id: createdInvoice.factory_id,
                            sales_contract_id: createdInvoice.sales_contract_id,
                            lc_id: createdInvoice.lc_id,
                            discount: createdInvoice.discount,
                            port_of_loading: createdInvoice.port_of_loading,
                            freight_term_id: createdInvoice.freight_term_id,
                            remarks: createdInvoice.remarks,
                            term_id: createdInvoice.term_id,
                            invoice_date: createdInvoice.invoice_date,
                        }
                    });
                    
                    await Promise.all(
                        (input.userConsigneeIds ?? []).map(async (consignee_id) => {
                            const addedConsignee = await tx.factory_invoice_consignee.create({
                                data: {
                                    factory_invoice_id: createdInvoice.id,
                                    consignee_id: Number(consignee_id),
                                }
                            });

                            await tx.factory_invoice_consignee_history.create({
                                data: {
                                    factory_invoice_consignee_id: addedConsignee.id,
                                    factory_invoice_id: createdInvoice.id,
                                    consignee_id: Number(consignee_id),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                }
                            });
                        })
                    );


                    await Promise.all(
                        (input.notifyPartyIds ?? []).map(async (notify_party) => {
                            const addedConsignee = await tx.factory_invoice_notify_party.create({
                                data: {
                                    factory_invoice_id: createdInvoice.id,
                                    notify_party_id: Number(notify_party),
                                }
                            });

                            await tx.factory_invoice_notify_party_history.create({
                                data: {
                                    factory_invoice_notify_party_id: addedConsignee.id,
                                    factory_invoice_id: createdInvoice.id,
                                    notify_party_id: Number(notify_party),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                }
                            });
                        })
                    );

                    // TNA Template generation
                    const tna_template_id = await tx.$queryRaw<{ id: string | null }[]>`
                        SELECT
                            CTP.ID
                        FROM commercial_tna_templates AS CTP 
                        WHERE CTP.payment_term_id = ( 
                            SELECT
                                MIN(SD.payment_term_id)
                            FROM FACTORY_INVOICE AS FI
                                INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            WHERE FI.id = ${createdInvoice.id}
                        )
                        AND CTP.BUYER_ID = ${input.buyer_id};
                    `;

                    if(tna_template_id.length === 0 || !tna_template_id[0]?.id) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'No TNA template found for the payment term and buyer of the factory invoice.'
                        });
                    }

                    const new_tna_plan = await tx.commercial_tna_planning.create({
                        data: {
                            commercial_tna_template_id: tna_template_id[0].id,
                            factory_invoice_id: createdInvoice.id,
                        }
                    })

                    if (tna_template_id.length > 0 && tna_template_id[0]?.id) {
                        await tx.$executeRaw`
                            WITH min_exfactory AS (
                                SELECT
                                    CTP.id AS commercial_tna_planning_id,
                                    MIN(E.exfactory_date) AS min_exfactory_date
                                FROM commercial_tna_planning AS CTP
                                INNER JOIN factory_invoice AS FI ON FI.id = CTP.factory_invoice_id
                                INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                WHERE CTP.id = ${new_tna_plan.id}
                                GROUP BY CTP.id
                            )
                            INSERT INTO commercial_tna_planning_details (
                                commercial_tna_planning_id,
                                commercial_tna_templates_actions_id,
                                plan_date
                            )
                            SELECT
                                CTP.id,
                                CTTA.id,
                                ME.min_exfactory_date + CTTA.days AS plan_date
                            FROM commercial_tna_planning AS CTP
                            INNER JOIN min_exfactory AS ME ON ME.commercial_tna_planning_id = CTP.id
                            INNER JOIN commercial_tna_templates AS CTT ON CTT.id = CTP.commercial_tna_template_id
                            INNER JOIN commercial_tna_templates_actions AS CTTA ON CTTA.commercial_tna_template_id = CTT.id;
                        `;
                    }

                    // Update factory invoice date in TNA
                    await tx.$executeRaw`
                        UPDATE commercial_tna_planning_details AS CTPD
                            SET actual_date = FI.invoice_date
                        FROM commercial_tna_planning AS CTP,
                            factory_invoice AS FI,
                            commercial_tna_templates_actions AS CTTA,
                            tna_actions AS TA
                        WHERE CTP.id = CTPD.commercial_tna_planning_id
                            AND FI.id = CTP.factory_invoice_id
                            AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                            AND TA.id = CTTA.tna_action_id
                            AND TA.id = ${FACTORY_INVOICE}
                            AND FI.id = ${createdInvoice.id};
                    `;

                    await tx.$executeRaw`
                        UPDATE commercial_tna_planning_details AS ctpd
                            SET actual_date = ex.min_exfactory_date
                        FROM commercial_tna_planning AS ctp
                            JOIN factory_invoice AS fi ON fi.id = ctp.factory_invoice_id
                            JOIN (
                                SELECT
                                    fid.factory_invoice_id,
                                    MIN(e.exfactory_date) AS min_exfactory_date
                                FROM factory_invoice_details AS fid
                                JOIN exfactory_shipments AS es ON es.id = fid.exfactory_shipment_id
                                JOIN exfactory_orders AS eo ON eo.id = es.exfactory_orders_id
                                JOIN exfactory AS e ON e.id = eo.exfactory_id
                                GROUP BY fid.factory_invoice_id
                            ) AS ex ON ex.factory_invoice_id = fi.id,
                            commercial_tna_templates_actions AS ctta,
                            tna_actions AS ta
                        WHERE ctp.id = ctpd.commercial_tna_planning_id
                            AND ctta.id = ctpd.commercial_tna_templates_actions_id
                            AND ta.id = ctta.tna_action_id
                            AND ta.id = ${ACTUAL_EXFACTORY_DATE}
                            AND fi.id = ${createdInvoice.id};
                    `;

                    return createdInvoice;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getScLcForFactoryInvoice: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
            factory_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view LC and Sales Contract details." 
                });
            }
            
            try {
                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                let scLcList: { id: string, sc_lc_no: string}[] = [];

                if (terms.name.toLowerCase() === 'tt') {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            SC.ID,
                            SC.SALES_CONTRACT_NO AS SC_LC_NO
                        FROM sales_contracts AS SC
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                            INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN exfactory_orders AS EO ON EO.ID = ES.exfactory_orders_id
	                        INNER JOIN exfactory AS E ON E.ID = EO.exfactory_id
                            INNER JOIN factories AS F ON f.id = SC.factory_id
                            INNER JOIN buyers AS B ON B.ID = SC.buyer_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM factory_invoice_details AS FID
                            WHERE FID.exfactory_shipment_id = ES.id
                        )
                        AND COALESCE(ES.DELIVERY_QUANTITY, 0) > 0
                        AND F.id = ${input.factory_id}
                        AND B.id = ${input.buyer_id}
                        AND E.is_authorized = TRUE
                        GROUP BY SC.ID;
                    `;
                }
                else {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        SELECT
                        	LC.id,
	                        LC.lc_no AS SC_LC_NO
                        FROM LC_MASTER AS LC
                            INNER JOIN lc_orders AS LO ON LC.id = LO.lc_master_id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN exfactory_orders AS EO ON EO.ID = ES.exfactory_orders_id
	                        INNER JOIN exfactory AS E ON E.ID = EO.exfactory_id
                            INNER JOIN buyers AS B ON B.ID = LC.buyer_id
                            INNER JOIN order_styles AS OS ON OS.ID = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                            INNER JOIN factories AS F ON F.ID = BO.factory_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM factory_invoice_details AS FID
                            WHERE FID.exfactory_shipment_id = ES.id
                        )
                        AND COALESCE(ES.DELIVERY_QUANTITY, 0) > 0
                        AND F.id = ${input.factory_id}
                        AND B.id = ${input.buyer_id}
                        AND E.is_authorized = TRUE
                        GROUP BY LC.id;
                    `;
                }

                return scLcList;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getShipmentDetailsForTagShipments: protectedProcedure
        .input(z.object({
            lc_sc_id: z.string(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;
            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view LC and Sales Contract details." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const terms = await ctx.db.terms.findUnique({
                        where: { id: input.term_id },
                        select: { name: true },
                    });

                    if (!terms) {
                        throw new TRPCError({ 
                            code: 'NOT_FOUND', 
                            message: "Terms not found." 
                        });
                    }

                    const isTT = terms.name.toLowerCase() === 'tt';

                    const scLcJoinClause = isTT
                        ? Prisma.sql`
                            INNER JOIN sales_contract_details AS SCD ON SCD.order_id = BO.id
                            INNER JOIN sales_contracts AS SC ON SC.ID = SCD.sales_contract_id
                        `
                        : Prisma.sql`
                            INNER JOIN lc_shipments AS LCS ON LCS.shipment_details_id = SD.id
                            INNER JOIN lc_orders AS LCO ON LCO.ID = LCS.lc_order_id
                            INNER JOIN LC_MASTER AS LC ON LC.ID = LCO.lc_master_id
                        `;

                    const scLcWhereClause = isTT
                        ? Prisma.sql`AND SC.ID = ${input.lc_sc_id}`
                        : Prisma.sql`AND LC.ID = ${input.lc_sc_id}`;

                    const shipments = await ctx.db.$queryRaw<ScLcListItem[]>`
                        SELECT
                            EFSD.ID,
                            BO.ref_no AS ORDER_NO,
                            OS.STYLE AS STYLE,
                            SD.BUYER_PO AS PO,
                            ES.exfactory_date AS EXFACTORY_DATE,
                            D.NAME AS DESTINATION,
                            SUM(SID.QUANTITY) AS ORDER_QUANTITY,
                            EFSD.DELIVERY_QUANTITY,
                            CASE
                                WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0	
                                    THEN FSD.TRANSFER_RATE
                                ELSE FSD.FACTORY_RATE
                            END AS FACTORY_FOB,
                            CASE
                                WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0	
                                    THEN FSD.TRANSFER_RATE * SUM(SID.QUANTITY)
                                ELSE FSD.FACTORY_RATE * SUM(SID.QUANTITY)
                            END AS FACTORY_VALUE
                        FROM exfactory AS ES
                            INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = ES.id
                            INNER JOIN exfactory_shipments AS EFSD ON EFSD.exfactory_orders_id = EO.id
                            INNER JOIN shipment_details AS SD ON SD.ID = EFSD.shipment_details_id
                            INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                            INNER JOIN order_styles AS OS ON OS.ID = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.ID = OS.order_id
                            INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN DESTINATIONS AS D ON D.id = SD.destination_id
                            ${scLcJoinClause}
                        WHERE ES.is_authorized = TRUE
                            AND NOT EXISTS (
                                SELECT 1
                                FROM factory_invoice_details AS FID
                                WHERE FID.EXFACTORY_SHIPMENT_ID = EFSD.ID
                            )
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
                                        INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                    WHERE T.BUYER_ID = BO.BUYER_ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            )
                            AND COALESCE(EFSD.DELIVERY_QUANTITY, 0) > 0
                            ${scLcWhereClause}
                        GROUP BY EFSD.ID, BO.ID, OS.ID, SD.ID, D.ID, FSD.ID, ES.ID;
                    `;

                    return shipments;
                }, {timeout: 30000})                
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getExfactoryDetailsForShipment: protectedProcedure
        .input(z.object({
            exfactory_shipment_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;
            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view shipment details." 
                });
            }
            
            try {
                const details = await ctx.db.$queryRaw<ExfactoryShipmentDetails[]>`
                    SELECT
                        BO.ref_no AS ORDER_NO,
                        OS.STYLE AS STYLE,
                        SD.BUYER_PO AS PO,
                        ES.exfactory_date AS EXFACTORY_DATE,
                        D.NAME AS DESTINATION,
                        SUM(SID.QUANTITY) AS ORDER_QUANTITY,
                        EFSD.DELIVERY_QUANTITY AS DELIVERY_QUANTITY,
                        CASE
                            WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0
                                THEN FSD.TRANSFER_RATE
                            ELSE FSD.FACTORY_RATE
                        END AS FACTORY_FOB,
                        CASE
                            WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0
                                THEN COALESCE(FSD.TRANSFER_RATE, 0) * EFSD.DELIVERY_QUANTITY
                            ELSE COALESCE(FSD.FACTORY_RATE, 0) * EFSD.DELIVERY_QUANTITY
                        END AS FACTORY_VALUE
                    FROM exfactory_shipments AS EFSD
                        INNER JOIN exfactory_orders AS EO ON EO.id = EFSD.exfactory_orders_id
                        INNER JOIN exfactory AS ES ON ES.id = EO.exfactory_id
                        INNER JOIN shipment_details AS SD ON SD.ID = EFSD.shipment_details_id
                        INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN order_styles AS OS ON OS.ID = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.ID = OS.order_id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN DESTINATIONS AS D ON D.id = SD.destination_id
                    WHERE EFSD.ID = ${input.exfactory_shipment_id}
                    GROUP BY BO.ID, OS.ID, SD.ID, D.ID, FSD.ID, EFSD.ID, ES.id;
                `;

                return details[0];
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFactoryInvoiceById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view factory invoice details." 
                });
            }
            
            try {
                const invoiceObj = await ctx.db.factory_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        factory_id: true,
                        buyer_id: true,
                        term_id: true,
                        lc_id: true,
                        sales_contracts: {
                            select: {
                                id: true,
                                sales_contract_no: true,
                            }
                        },
                        lc_master: {
                            select: {
                                id: true,
                                lc_no: true,
                            }
                        },
                        invoice_no: true,
                        invoice_date: true,
                        discount: true,
                        remarks: true,
                        shipment_mode: true,
                        port_of_loading: true,
                        freight_term_id: true,
                        factory_invoice_consignee: {
                            select: {
                                consignee_id: true,
                            }
                        },
                        factory_invoice_notify_party: {
                            select: {
                                notify_party_id: true,
                            }
                        },
                        factory_invoice_details: {
                            select: {
                                id: true,
                                exfactory_shipment_id: true,
                            }
                        }
                    }
                });

                const invoice = invoiceObj ? {
                    id: invoiceObj.id,
                    factory_id: invoiceObj.factory_id,
                    buyer_id: invoiceObj.buyer_id,
                    term_id: invoiceObj.term_id,
                    sales_contract_id: (Array.isArray(invoiceObj.sales_contracts)
                        ? (invoiceObj.sales_contracts[0]?.id ?? invoiceObj.lc_master?.id)
                        : (invoiceObj.sales_contracts?.id ?? invoiceObj.lc_master?.id))?.toString() ?? '',
                    lc_id: (Array.isArray(invoiceObj.lc_master)
                        ? invoiceObj.lc_master[0]?.id
                        : invoiceObj.lc_master?.id)?.toString() ?? '',
                    sales_contract_no: (Array.isArray(invoiceObj.sales_contracts) 
                        ? invoiceObj.sales_contracts[0]?.sales_contract_no 
                        : invoiceObj.sales_contracts?.sales_contract_no),
                    lc_no: (Array.isArray(invoiceObj.lc_master) 
                        ? invoiceObj.lc_master[0]?.lc_no 
                        : invoiceObj.lc_master?.lc_no),
                    invoice_no: invoiceObj.invoice_no,
                    invoice_date: invoiceObj.invoice_date,
                    shipment_mode: invoiceObj.shipment_mode,
                    discount: invoiceObj.discount,
                    remarks: invoiceObj.remarks,
                    port_of_loading: invoiceObj.port_of_loading,
                    freight_term_id: invoiceObj.freight_term_id,
                    consignee_ids: invoiceObj.factory_invoice_consignee,
                    notifyPartyIds: invoiceObj.factory_invoice_notify_party,
                    details: invoiceObj.factory_invoice_details.map(d => ({
                        id: d.id,
                        exfactory_shipment_id: d.exfactory_shipment_id,
                    })),
                    factory_invoice_details: invoiceObj.factory_invoice_details
                } : null;

                return invoice;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateFactoryInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
            discount: z.number().optional(),
            remarks: z.string().optional(),
            shipment_mode: z.string().optional(),
            details: z.array(z.object({
                db_id: z.string().optional(),
                exfactory_shipment_id: z.string(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.FACTORY_INVOICE]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to update factory invoices." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedInvoice = await tx.factory_invoice.update({
                        where: { id: input.id },
                        data: {
                            shipment_mode: input.shipment_mode as shipment_modes,
                            discount: input.discount,
                            remarks: input.remarks,
                        }
                    });

                    await tx.factory_invoice_history.create({
                        data: {
                            factory_invoice_id: updatedInvoice.id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                            invoice_no: updatedInvoice.invoice_no,
                            factory_id: updatedInvoice.factory_id,
                            sales_contract_id: updatedInvoice.sales_contract_id,
                            lc_id: updatedInvoice.lc_id,
                            discount: updatedInvoice.discount,
                            remarks: updatedInvoice.remarks,
                            term_id: updatedInvoice.term_id,
                            invoice_date: updatedInvoice.invoice_date,
                        }
                    })

                    const detailsToBeAdded = input.details?.filter(detail => !detail.db_id) ?? [];

                    for (const detail of detailsToBeAdded) {
                        const addedDetails = await tx.factory_invoice_details.create({
                            data: {
                                factory_invoice_id: input.id,
                                exfactory_shipment_id: detail.exfactory_shipment_id,
                            }
                        })

                        await tx.factory_invoice_details_history.create({
                            data: {
                                factory_invoice_details_id: addedDetails.id,
                                factory_invoice_id: input.id,
                                exfactory_shipment_id: detail.exfactory_shipment_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            }
                        })
                    }

                    return updatedInvoice;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteFactoryInvoiceDetail: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FACTORY_INVOICE]?.can_delete;
            if (!can_delete) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to delete factory invoice details." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const detail = await tx.factory_invoice_details.delete({
                        where: { id: input.id },
                    });

                    await tx.factory_invoice_details_history.create({
                        data: {
                            factory_invoice_details_id: detail.id,
                            factory_invoice_id: detail.factory_invoice_id,
                            exfactory_shipment_id: detail.exfactory_shipment_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });

                    return detail;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPDFData: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_INVOICE]?.can_view;
            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view factory invoice details." 
                });
            }
            
            try {
                const isATeamMember = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        teams: {
                            buyers: {
                                factory_invoice: {
                                    some: {
                                        id: input.id,
                                    }
                                }
                            }
                        }
                    },
                    select: {
                        id: true,
                    }
                });

                if(!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view this Factory Invoice." 
                    });
                }

                const data = await ctx.db.factory_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        invoice_no: true,
                        invoice_date: true,
                        shipment_mode: true,
                        discount: true,
                        terms: {
                            select: { name: true },
                        },
                        factories: {
                            select: { 
                                name: true,
                                factory_address: true,
                                factory_bank: {
                                    select: {
                                        account_name: true,
                                        account_no: true,
                                        address: true,
                                        branch_name: true,
                                        swift_code: true,
                                        banks: {
                                            select: {
                                                name: true,
                                            }
                                        }
                                    }
                                },
                            },
                        },
                        freight_term: {
                            select: {
                                name: true,
                            }
                        },
                        destinations: {
                            select: {
                                name: true,
                            }
                        },
                        buyers: {
                            select: {
                                buyer_name: true,
                                address: true,
                            }
                        },
                        sales_contracts: {
                            select: {
                                sales_contract_no: true,
                                sales_contract_date: true,
                                destinations: {
                                    select: {
                                        name: true,
                                    }
                                }
                            }
                        },
                        lc_master: {
                            select: {
                                lc_no: true,
                                lc_open_date: true,
                            }
                        },
                        factory_invoice_details: {
                            select: {
                                exfactory_shipments: {
                                    select: {
                                        shipment_details: {
                                            select: {
                                                shipment_mode: true,
                                                destinations: {
                                                    select: {
                                                        name: true,
                                                    }
                                                },
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        factory_invoice_consignee: {
                            select: {
                                buyer_consignee: {
                                    select: {
                                        consignee_name: true,
                                        address: true,
                                    }
                                }
                            }
                        },
                        factory_invoice_notify_party: {
                            select: {
                                buyer_consignee: {
                                    select: {
                                        consignee_name: true,
                                        address: true,
                                    }
                                }
                            }
                        }
                    }
                });

                const table = await ctx.db.$queryRaw<FactoryInvoicePDFTableItem[]>`
                    SELECT
                        BB.brand,
                        SD.buyer_po,
                        OS.style,
                        ES.delivery_quantity,
                        sum(ES.delivery_quantity) OVER () AS total_quantity,
                        CASE
                            WHEN FSD.transfer_rate <> 0
                                THEN FSD.transfer_rate
                            ELSE FSD.factory_rate
                        END AS UNIT_PRICE,
                        CASE
                            WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                THEN COALESCE(FSD.transfer_rate, 0) * ES.delivery_quantity
                            ELSE FSD.factory_rate * ES.delivery_quantity
                        END AS total_price,
                        SUM(
                            CASE
                                WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                    THEN COALESCE(FSD.transfer_rate, 0) * ES.delivery_quantity
                                ELSE FSD.factory_rate * ES.delivery_quantity
                            END
                        ) OVER () AS grand_total,
                        C.symbol
                    FROM factory_invoice AS FI
                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                        INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.ID = OS.order_id
                        INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id
                        INNER JOIN factory_orders AS FO ON FO.ID = FSD.factory_order_id
                        INNER JOIN currencies AS C ON C.id = FO.currency_id
                    WHERE FI.ID = ${input.id};
                `;

                const factoryInvoiceHeader = data ? {
                    factory_name: data.factories.name,
                    factory_address: data.factories.factory_address,
                    factory_bank_account_name: data.factories.factory_bank?.[0]?.account_name ?? null,
                    factory_bank_account_no: data.factories.factory_bank?.[0]?.account_no ?? null,
                    factory_bank_address: data.factories.factory_bank?.[0]?.address ?? null,
                    factory_bank_branch_name: data.factories.factory_bank?.[0]?.branch_name ?? null,
                    factory_bank_swift_code: data.factories.factory_bank?.[0]?.swift_code ?? null,
                    factory_bank_name: data.factories.factory_bank?.[0]?.banks?.name ?? null,
                    buyer_name: data.buyers?.buyer_name ?? null,
                    buyer_address: data.buyers?.address ?? null,
                    invoice_no: data.invoice_no,
                    invoice_date: data.invoice_date,
                    term_name: data.terms?.name ?? null,
                    freight_term_name: data.freight_term?.name ?? null,
                    port_of_loading: data.destinations?.name ? data.destinations?.name : data.sales_contracts?.destinations?.name,
                    sales_contract_no: data.sales_contracts?.sales_contract_no ?? null,
                    sales_contract_date: data.sales_contracts?.sales_contract_date ?? null,
                    lc_no: data.lc_master?.lc_no ?? null,
                    lc_open_date: data.lc_master?.lc_open_date ?? null,
                    final_destination: data.factory_invoice_details?.[0]?.exfactory_shipments?.shipment_details?.destinations?.name ?? null,
                    consignees: data.factory_invoice_consignee,
                    notify_parties: data.factory_invoice_notify_party,
                    discount: data.discount,
                    shipment_mode: data.shipment_mode ? data.shipment_mode : data.factory_invoice_details?.[0]?.exfactory_shipments?.shipment_details?.shipment_mode,
                } : null;

                const tableWithFormattedValues = table.map(item => ({
                    ...item,
                    total_quantity: quantityFormatter(Number(item.total_quantity)),
                    unit_price: currencyFormatter(Number(item.unit_price), item.symbol),
                    total_price: currencyFormatter(Number(item.total_price), item.symbol),
                    grand_total: currencyFormatter(Number(item.grand_total), item.symbol),
                }));

                const discountedValue = table.length > 0 ? Number(table[0]?.grand_total) - (data?.discount ?? 0) : 0;
                const discountedValueStr = currencyFormatter(discountedValue, table[0]?.symbol ?? '$');

                return {header: factoryInvoiceHeader, table: tableWithFormattedValues, discountedValue: discountedValueStr };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkIfRdlInvoiceExists: protectedProcedure
        .input(z.object({
            factory_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const count = await ctx.db.rdl_invoice_details.count({
                    where: { factory_invoice_id: input.factory_invoice_id },
                });

                return { exists: count > 0 };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})