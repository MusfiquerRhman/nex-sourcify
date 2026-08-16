import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { 
    RdlInvoiceListItem, ShipmentDetailForFactoryInvoice, FactoryInvoiceForRDLInvoice, 
    FactoryInvoicePDFTableItem, BankDetailsOfBeneficiary 
} from './_types/rdlInvoice';

export const rdlInvoiceRouter = createTRPCRouter({
    getRdlInvoice: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<RdlInvoiceListItem[]>`
                     WITH RDL_INVOICES AS (
                        SELECT
                            RI.ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            COALESCE(RI.IS_AUTHORIZED, FALSE) AS IS_AUTHORIZED,
                            COALESCE(SUM(SD.FOB_RATE * RISD.INVOICE_QUANTITY) - RI.DISCOUNT, 0) AS VALUE,
                            C.SYMBOL,
                            RI.ADDED_AT
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN FACTORY_INVOICE AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = RISD.shipment_details_id
                            INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                            INNER JOIN CURRENCIES AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.id = RI.buyer_id
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
                        GROUP BY RI.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM RDL_INVOICES
                    ORDER BY INVOICE_DATE DESC, ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const rdlInvoices = result.map(({ total_count: _,  value, symbol, ...invoice}) => (
                    { ...invoice, value: currencyFormatter(value, symbol) })
                );

                return { rdlInvoices, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchRdlInvoices: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<RdlInvoiceListItem[]>`
                    WITH RDL_INVOICES AS (
                        SELECT
                            RI.ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            COALESCE(RI.IS_AUTHORIZED, FALSE) AS IS_AUTHORIZED,
                            SUM(SD.FOB_RATE * RISD.INVOICE_QUANTITY) - RI.DISCOUNT AS VALUE,
                            C.SYMBOL,
                            RI.ADDED_AT
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN FACTORY_INVOICE AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = RISD.shipment_details_id
                            INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                            INNER JOIN CURRENCIES AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.id = RI.buyer_id
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
                        AND (
                            B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR RI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR OS.STYLE ILIKE '%' || ${input.query} || '%'
                            OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY RI.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM RDL_INVOICES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const rdlInvoices = result.map(({ total_count: _,  value, symbol, ...invoice}) => (
                    { ...invoice, value: currencyFormatter(value, symbol) })
                );

                return { rdlInvoices, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteRdlInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.RDL_INVOICE]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Invoices." 
                });
            }
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    const rdlInvoiceDetails = await tx.rdl_invoice_details.findMany({
                        where: { rdl_invoice_id: input.id },
                    });

                    const rdlInvoiceShipmentDetails = await tx.rdl_invoice_shipment_details.findMany({
                        where: {
                            rdl_invoice_details_id: {
                                in: rdlInvoiceDetails.map(detail => detail.id),
                            },
                        },
                    });

                    await Promise.all([
                        await tx.rdl_invoice_shipment_details_history.createMany({
                            data: rdlInvoiceShipmentDetails.map(detail => ({
                                rdl_invoice_details_id: detail.rdl_invoice_details_id,
                                shipment_details_id: detail.shipment_details_id,
                                invoice_quantity: detail.invoice_quantity,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        }),

                        await tx.rdl_invoice_details_history.createMany({
                            data: rdlInvoiceDetails.map(detail => ({
                                rdl_invoice_details: detail.id,
                                rdl_invoice_id: detail.rdl_invoice_id,
                                factory_invoice_id: detail.factory_invoice_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        }),

                        await tx.rdl_invoice_shipment_details.deleteMany({
                            where: {
                                rdl_invoice_details_id: {
                                    in: rdlInvoiceDetails.map(detail => detail.id),
                                },
                            },
                        }),

                        await tx.rdl_invoice_details.deleteMany({
                            where: { rdl_invoice_id: input.id },
                        }),
                    ]);

                    const deleted = await tx.rdl_invoice.delete({
                        where: { id: input.id },
                    });

                    await tx.rdl_invoice_history.create({
                        data: {
                            rdl_invoice_id: deleted.id,
                            buyer_id: deleted.buyer_id,
                            term_id: deleted.term_id,
                            invoice_no: deleted.invoice_no,
                            invoice_date: deleted.invoice_date,
                            sales_contract_id: deleted.sales_contract_id,
                            lc_id: deleted.lc_id,
                            invoice_type: deleted.invoice_type,
                            pi_no: deleted.pi_no,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            contact_no: deleted.contact_no,
                            container_no: deleted.container_no,
                        },
                    });
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getRdlInvoiceById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Invoices." 
                });
            }
            
            try {
                const rdlInvoice = await ctx.db.rdl_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        buyer_id: true,
                        term_id: true,
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
                        invoice_type: true,
                        pi_no: true,
                        container_no: true,
                        contact_no: true,
                        is_authorized: true,
                        discount: true,
                        remarks: true,
                        rdl_invoice_details: {
                            select: {
                                id: true,
                                factory_id: true,
                                factory_invoice: {
                                    select: {
                                        id: true,
                                        invoice_no: true,
                                    },
                                },
                                rdl_invoice_shipment_details: {
                                    select: {
                                        id: true,
                                        shipment_details_id: true,
                                        invoice_quantity: true,
                                        factory_invoice_details_id: true,
                                    }
                                }
                            }
                        }
                    }
                });

                const result = {
                    ...rdlInvoice,
                    rdl_invoice_details: rdlInvoice?.rdl_invoice_details.map((detail) => ({
                        ...detail,
                        factory_invoice: detail.factory_invoice ? {
                            id: detail.factory_invoice.id,
                            invoice_no: detail.factory_invoice?.invoice_no,
                        } : null,
                    })) ?? [],
                };

                return result;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getScLcForRDLInvoice: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: "You don't have permission to view Invoices." 
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
                        WITH SC_EXFACTORY AS (
                            SELECT 
                                FID.factory_invoice_id AS FID,
                                SUM(ES.DELIVERY_QUANTITY) AS EF_QUANTITY
                            FROM factory_invoice_details AS FID
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            GROUP BY FID.factory_invoice_id
                        ),
                        IN_RDL_INVOICE AS (
                            SELECT 
                                RID.factory_invoice_id AS FID,
                                SUM(RISD.INVOICE_QUANTITY) AS RDL_QUANTITY
                            FROM rdl_invoice_details AS RID
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            GROUP BY RID.factory_invoice_id
                        )
                        SELECT DISTINCT
                            SC.ID,
                            SC.SALES_CONTRACT_NO AS SC_LC_NO
                        FROM sales_contracts AS SC
                            INNER JOIN factory_invoice AS FI ON FI.sales_contract_id = SC.id
                            INNER JOIN SC_EXFACTORY AS E ON E.FID = FI.id
                            LEFT JOIN IN_RDL_INVOICE AS R ON R.FID = FI.id
                        WHERE SC.buyer_id = ${input.buyer_id}
                        GROUP BY SC.ID
                        HAVING COALESCE(SUM(E.EF_QUANTITY), 0)::NUMERIC(18,2)  > COALESCE(SUM(R.RDL_QUANTITY), 0)::NUMERIC(18,2);
                    `;
                }
                else {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        WITH LC_EXFACTORY AS (
                            SELECT 
                                FID.factory_invoice_id AS FID,
                                SUM(ES.DELIVERY_QUANTITY) AS EF_QUANTITY
                            FROM factory_invoice_details AS FID
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            GROUP BY FID.factory_invoice_id
                        ),
                        IN_RDL_INVOICE AS (
                            SELECT 
                                RID.factory_invoice_id AS FID,
                                SUM(RISD.INVOICE_QUANTITY) AS RDL_QUANTITY
                            FROM rdl_invoice_details AS RID
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            GROUP BY RID.factory_invoice_id
                        )
                        SELECT DISTINCT
                            LC.id,
                            LC.lc_no AS SC_LC_NO
                        FROM lc_master AS LC
                            INNER JOIN factory_invoice AS FI ON FI.lc_id = LC.id
                            INNER JOIN LC_EXFACTORY AS E ON E.FID = FI.id
                            LEFT JOIN IN_RDL_INVOICE AS R ON R.FID = FI.id
                        WHERE LC.buyer_id = ${input.buyer_id}
                        GROUP BY LC.ID
                        HAVING COALESCE(SUM(E.EF_QUANTITY), 0)::NUMERIC(18,2)  > COALESCE(SUM(R.RDL_QUANTITY), 0)::NUMERIC(18,2);
                    `;
                }

                return scLcList;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addRdlInvoice: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
            lc_sc_id: z.string(),
            invoice_date: z.date(),
            invoice_type: z.boolean().optional(),
            pi_no: z.string().optional(),
            remarks: z.string().optional(),
            container_no: z.string().optional(),
            invoice_no: z.string(),
            contact_no: z.string().optional(),
            discount: z.number().optional(),
            details: z.array(z.object({
                factory_id: z.number(),
                factory_invoice_id: z.string(),
                shipments: z.array(z.object({
                    shipment_details_id: z.string(),
                    factory_invoice_details_id: z.string(),
                    invoice_quantity: z.number(),
                })),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_create = ctx.permissions[m.RDL_INVOICE]?.can_add;

                if (!can_create) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to create Invoices." 
                    });
                }

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

                return await ctx.db.$transaction(async (tx) => {
                    const rdlInvoice = await tx.rdl_invoice.create({
                        data: {
                            buyer_id: input.buyer_id,
                            term_id: input.term_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            invoice_no: input.invoice_no,
                            invoice_date: input.invoice_date,
                            invoice_type: input.invoice_type,
                            pi_no: input.pi_no,
                            container_no: input.container_no,
                            contact_no: input.contact_no,
                            discount: input.discount,
                            remarks: input.remarks,
                        },
                    });

                    await tx.rdl_invoice_history.create({
                        data: {
                            rdl_invoice_id: rdlInvoice.id,
                            buyer_id: rdlInvoice.buyer_id,
                            term_id: rdlInvoice.term_id,
                            invoice_no: rdlInvoice.invoice_no,
                            invoice_date: rdlInvoice.invoice_date,
                            sales_contract_id: rdlInvoice.sales_contract_id,
                            lc_id: rdlInvoice.lc_id,
                            invoice_type: rdlInvoice.invoice_type,
                            pi_no: rdlInvoice.pi_no,
                            container_no: rdlInvoice.container_no,
                            contact_no: rdlInvoice.contact_no,
                            discount: rdlInvoice.discount,
                            remarks: rdlInvoice.remarks,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    await Promise.all(
                        input.details.map(async (detail) => {
                            const rdlInvoiceDetail = await tx.rdl_invoice_details.create({
                                data: {
                                    rdl_invoice_id: rdlInvoice.id,
                                    factory_id: detail.factory_id,
                                    factory_invoice_id: detail.factory_invoice_id,
                                },
                            });

                            await Promise.all(
                                detail.shipments.map(async (shipment) => {
                                    const shipmentDetail = await tx.rdl_invoice_shipment_details.create({
                                        data: {
                                            rdl_invoice_details_id: rdlInvoiceDetail.id,
                                            shipment_details_id: shipment.shipment_details_id,
                                            factory_invoice_details_id: shipment.factory_invoice_details_id,
                                            invoice_quantity: shipment.invoice_quantity,
                                        },
                                    });

                                    tx.rdl_invoice_shipment_details_history.create({
                                        data: {
                                            rdl_invoice_details_id: shipmentDetail.rdl_invoice_details_id,
                                            shipment_details_id: shipmentDetail.shipment_details_id,
                                            invoice_quantity: shipmentDetail.invoice_quantity,
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                        },
                                    })
                                })
                            );

                            tx.rdl_invoice_details_history.create({
                                data: {
                                    rdl_invoice_details: rdlInvoiceDetail.id,
                                    rdl_invoice_id: rdlInvoiceDetail.rdl_invoice_id,
                                    factory_id: rdlInvoiceDetail.factory_id,
                                    factory_invoice_id: rdlInvoiceDetail.factory_invoice_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        })
                    );

                    return rdlInvoice;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFactoryInvoiceForRDLInvoice: protectedProcedure
        .input(z.object({
            factory_id: z.number(),
            term_id: z.number(),
            lc_sc_id: z.string(),
            rdl_invoice_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Factory Invoices." 
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

                const isTT = terms.name.toLowerCase() === 'tt';

                const whereClause = isTT
                    ? Prisma.sql`FI.sales_contract_id = ${input.lc_sc_id}`
                    : Prisma.sql`FI.lc_id = ${input.lc_sc_id}`;

                const currentInvoiceJoin = input.rdl_invoice_id
                    ? Prisma.sql`
                        LEFT JOIN rdl_invoice_details CRID ON CRID.factory_invoice_id = FI.ID
                        AND CRID.rdl_invoice_id = ${input.rdl_invoice_id}
                    `
                    : Prisma.empty;

                const invoiceFilter = input.rdl_invoice_id
                    ? Prisma.sql`
                        AND (
                            CRID.ID IS NOT NULL
                            OR PI.FACTORY_INVOICE_ID IS NULL
                            OR COALESCE(PI.PREVIOUS_QUANTITY, 0)::NUMERIC(18,2) < I.TOTAL_QUANTITY::NUMERIC(18,2)
                        )
                    `
                    : Prisma.empty;

                const havingClause = input.rdl_invoice_id
                    ? Prisma.empty
                    : Prisma.sql`
                        HAVING (
                            COALESCE(PI.PREVIOUS_QUANTITY, 0)::NUMERIC(18,2) < SUM(I.TOTAL_QUANTITY)::NUMERIC(18,2)
                            OR PI.FACTORY_INVOICE_ID IS NULL
                        )
                    `;
                        

                const excludeCurrentInvoiceClause = input.rdl_invoice_id 
                    ? Prisma.sql`WHERE RI.ID <> ${input.rdl_invoice_id}` 
                    : Prisma.empty;

                const factoryInvoiceList = await ctx.db.$queryRaw<FactoryInvoiceForRDLInvoice[]>`
                    WITH PREVIOUS_INVOICE AS (
                        SELECT
                            RID.factory_invoice_id AS FACTORY_INVOICE_ID,
                            SUM(RISD.INVOICE_QUANTITY) AS PREVIOUS_QUANTITY
                        FROM RDL_INVOICE RI
                            INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = RI.ID
                            INNER JOIN RDL_INVOICE_SHIPMENT_DETAILS RISD ON RISD.rdl_invoice_details_id = RID.ID
                            ${excludeCurrentInvoiceClause}
                        GROUP BY RID.factory_invoice_id
                    ),
                    INVOICE AS (
                        SELECT
                            ES.id AS EFSD_ID,
                            CASE
                                WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0
                                    THEN FSD.TRANSFER_RATE * SUM(ES.delivery_quantity)
                                ELSE FSD.FACTORY_RATE * SUM(ES.delivery_quantity)
                            END AS FACTORY_VALUE,
                            SUM(ES.delivery_quantity) AS TOTAL_QUANTITY
                        FROM exfactory_shipments ES
                            INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                        GROUP BY ES.id, FSD.ID, FSD.TRANSFER_RATE, FSD.FACTORY_RATE
                    )
                    SELECT DISTINCT
                        FI.ID,
                        FI.INVOICE_NO,
                        SUM(I.TOTAL_QUANTITY) AS TOTAL_QUANTITY,
                        SUM(I.FACTORY_VALUE) - COALESCE(FI.discount, 0) AS FACTORY_VALUE
                    FROM FACTORY_INVOICE FI
                        INNER JOIN factory_invoice_details FID ON FID.factory_invoice_id = FI.ID
                        INNER JOIN INVOICE I ON I.EFSD_ID = FID.exfactory_shipment_id
                        LEFT JOIN PREVIOUS_INVOICE PI ON PI.FACTORY_INVOICE_ID = FI.ID
                        ${currentInvoiceJoin}
                    WHERE
                        FI.factory_id = ${input.factory_id}
                        AND ${whereClause}
                        ${invoiceFilter}
                    GROUP BY FI.ID, FI.INVOICE_NO, PI.FACTORY_INVOICE_ID, PI.PREVIOUS_QUANTITY
                    ${havingClause}
                `;

                const factoryInvoice = factoryInvoiceList.map(invoice => ({
                    ...invoice,
                    total_quantity: Number(invoice.total_quantity),
                    factory_value: Number(invoice.factory_value),
                }));

                return factoryInvoice;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteFactoryInvoice: protectedProcedure
        .input(z.object({
            db_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.RDL_INVOICE]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Factory Invoices from Invoices." 
                });
            }
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    const rdlInvoiceDetail = await tx.rdl_invoice_details.findUnique({
                        where: { id: input.db_id },
                    });

                    const rdlInvoiceShipmentDetails = await tx.rdl_invoice_shipment_details.findMany({
                        where: { rdl_invoice_details_id: input.db_id },
                    });

                    await tx.rdl_invoice_shipment_details_history.createMany({
                        data: rdlInvoiceShipmentDetails.map(detail => ({
                            rdl_invoice_details_id: detail.rdl_invoice_details_id,
                            shipment_details_id: detail.shipment_details_id,
                            invoice_quantity: detail.invoice_quantity,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        })),
                    });

                    await tx.rdl_invoice_details_history.create({
                        data: {
                            rdl_invoice_details: rdlInvoiceDetail?.id ?? "",
                            rdl_invoice_id: rdlInvoiceDetail?.rdl_invoice_id ?? "",
                            factory_id: rdlInvoiceDetail?.factory_id ?? 0,
                            factory_invoice_id: rdlInvoiceDetail?.factory_invoice_id ?? "",
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    await tx.rdl_invoice_shipment_details.deleteMany({
                        where: { rdl_invoice_details_id: input.db_id },
                    });

                    await tx.rdl_invoice_details.delete({
                        where: { id: input.db_id },
                    });
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getShipmentDetailsForFactoryInvoice: protectedProcedure
        .input(z.object({
            factory_invoice_id: z.string(),
            rdl_invoice_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Shipment Details for Factory Invoices." 
                });
            }
            
            try {
                const excludeCurrentInvoiceClause = input.rdl_invoice_id 
                    ? Prisma.sql`WHERE RI.ID <> ${input.rdl_invoice_id}` 
                    : Prisma.empty;

                const shipmentDetailsObj = await ctx.db.$queryRaw<ShipmentDetailForFactoryInvoice[]>`
                    WITH PREVIOUS_INVOICE AS (
                        SELECT
                            RID.factory_invoice_id AS FACTORY_INVOICE_ID,
                            SUM(RISD.INVOICE_QUANTITY) AS PREVIOUS_QUANTITY
                        FROM RDL_INVOICE RI
                            INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = RI.ID
                            INNER JOIN RDL_INVOICE_SHIPMENT_DETAILS RISD ON RISD.rdl_invoice_details_id = RID.ID
                            ${excludeCurrentInvoiceClause}
                        GROUP BY RISD.factory_invoice_details_id, RID.factory_invoice_id
                    )
                    SELECT 
                        FID.id AS id,
                        BO.ref_no AS ORDER_NO,
                        OS.STYLE AS STYLES,
                        SD.BUYER_PO AS PO,
                        SD.id AS SHIPMENT_DETAILS_ID,
                        D.NAME AS DESTINATION,
                        ES.delivery_quantity AS ORDER_QUANTITY,
                        PI.PREVIOUS_QUANTITY,
                        SD.FOB_RATE AS FOB_RATE
                    FROM factory_invoice AS FI
                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.id = ES.shipment_details_id
                        INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                        INNER JOIN BUYER_ORDERS AS BO ON BO.id = OS.order_id
                        INNER JOIN DESTINATIONS AS D ON D.id = SD.destination_id
                        LEFT JOIN PREVIOUS_INVOICE PI ON PI.FACTORY_INVOICE_ID = FI.ID
                    WHERE FI.ID = ${input.factory_invoice_id}
                    GROUP BY BO.ID, OS.ID, SD.ID, FID.ID, D.ID, PI.PREVIOUS_QUANTITY, ES.ID;
                `;

                const shipmentDetails = shipmentDetailsObj.map(detail => ({
                    id: detail.id,
                    order_no: detail.order_no,
                    styles: detail.styles,
                    po: detail.po,
                    destination: detail.destination,
                    shipment_details_id: detail.shipment_details_id,
                    previous_quantity: Number(detail.previous_quantity),
                    order_quantity: Number(detail.order_quantity),
                    fob_rate: Number(detail.fob_rate),
                }));

                return shipmentDetails;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateRdlInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
            invoice_date: z.date(),
            pi_no: z.string().optional(),
            remarks: z.string().optional(),
            container_no: z.string().optional(),
            contact_no: z.string().optional(),
            discount: z.number().optional(),
            details: z.array(z.object({
                db_id: z.string().optional(),
                factory_id: z.number(),
                factory_invoice_id: z.string(),
                shipments: z.array(z.object({
                    db_id: z.string().optional(),
                    shipment_details_id: z.string(),
                    invoice_quantity: z.number(),
                    factory_invoice_details_id: z.string(),
                })),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.RDL_INVOICE]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update Invoices." 
                });
            }
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    const updated = await tx.rdl_invoice.update({
                        where: { id: input.id },
                        data: {
                            invoice_date: input.invoice_date,
                            pi_no: input.pi_no,
                            remarks: input.remarks,
                            container_no: input.container_no,
                            contact_no: input.contact_no,
                            discount: input.discount,
                        }
                    });

                    await tx.rdl_invoice_history.create({
                        data: {
                            rdl_invoice_id: updated.id,
                            buyer_id: updated.buyer_id,
                            term_id: updated.term_id,
                            invoice_no: updated.invoice_no,
                            invoice_date: updated.invoice_date,
                            sales_contract_id: updated.sales_contract_id,
                            lc_id: updated.lc_id,
                            invoice_type: updated.invoice_type,
                            pi_no: updated.pi_no,
                            container_no: updated.container_no,
                            contact_no: updated.contact_no,
                            discount: updated.discount,
                            remarks: updated.remarks,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    await Promise.all(
                        input.details.map(async (detail) => {
                            if (!detail.db_id) {
                                // New detail - create it
                                const newDetail = await tx.rdl_invoice_details.create({
                                    data: {
                                        rdl_invoice_id: input.id,
                                        factory_id: detail.factory_id,
                                        factory_invoice_id: detail.factory_invoice_id,
                                    },
                                });

                                await Promise.all(
                                    detail.shipments.map(async (shipment) => {
                                        const newShipment = await tx.rdl_invoice_shipment_details.create({
                                            data: {
                                                rdl_invoice_details_id: newDetail.id,
                                                shipment_details_id: shipment.shipment_details_id,
                                                invoice_quantity: shipment.invoice_quantity,
                                                factory_invoice_details_id: shipment.factory_invoice_details_id,
                                            },
                                        });
                                        tx.rdl_invoice_shipment_details_history.create({
                                            data: {
                                                rdl_invoice_details_id: newShipment.rdl_invoice_details_id,
                                                shipment_details_id: newShipment.shipment_details_id,
                                                invoice_quantity: newShipment.invoice_quantity,
                                                factory_invoice_details_id: newShipment.factory_invoice_details_id,
                                                action_type: actions.ADDED,
                                                action_by: ctx.user.id,
                                            },
                                        });
                                    })
                                );

                                tx.rdl_invoice_details_history.create({
                                    data: {
                                        rdl_invoice_details: newDetail.id,
                                        rdl_invoice_id: newDetail.rdl_invoice_id,
                                        factory_id: newDetail.factory_id,
                                        factory_invoice_id: newDetail.factory_invoice_id,
                                        action_type: actions.ADDED,
                                        action_by: ctx.user.id,
                                    },
                                });
                            }
                            else {
                                // Existing detail - update it
                                await Promise.all(
                                    detail.shipments.map(async (shipment) => {
                                        if (!shipment.db_id) {
                                            // New shipment - create it
                                            const newShipment = await tx.rdl_invoice_shipment_details.create({
                                                data: {
                                                    rdl_invoice_details_id: detail.db_id,
                                                    shipment_details_id: shipment.shipment_details_id,
                                                    invoice_quantity: shipment.invoice_quantity,
                                                    factory_invoice_details_id: shipment.factory_invoice_details_id,
                                                },
                                            });
                                            tx.rdl_invoice_shipment_details_history.create({
                                                data: {
                                                    rdl_invoice_details_id: newShipment.rdl_invoice_details_id,
                                                    shipment_details_id: newShipment.shipment_details_id,
                                                    invoice_quantity: newShipment.invoice_quantity,
                                                    factory_invoice_details_id: newShipment.factory_invoice_details_id, 
                                                    action_type: actions.ADDED,
                                                    action_by: ctx.user.id,
                                                },
                                            });
                                        }
                                        else {
                                            // Existing shipment - update it
                                            await tx.rdl_invoice_shipment_details.update({
                                                where: { id: shipment.db_id },
                                                data: {
                                                    invoice_quantity: shipment.invoice_quantity,
                                                },
                                            });
                                            tx.rdl_invoice_shipment_details_history.create({
                                                data: {
                                                    rdl_invoice_details_id: detail.db_id,
                                                    shipment_details_id: shipment.shipment_details_id,
                                                    invoice_quantity: shipment.invoice_quantity,
                                                    action_type: actions.UPDATE,
                                                    action_by: ctx.user.id,
                                                },
                                            });
                                        }
                                    })
                                )
                            }
                        })
                    );
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAuthorizations: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view invoices." 
                });
            }

            try {
                const authorizationState = await ctx.db.rdl_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        is_authorized: true,
                    }
                });

                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number}[]>`
                    SELECT 
                        department_id, level_id 
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.RDL_INVOICE}
                        AND level_id = ${ctx.user.level_id}
                        AND department_id = ${ctx.user.department_id}
                    LIMIT 1;
                `;

                return {authorization: authorizationState, permission: authorizationPermission[0]};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    approveRDLInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
            approval_status: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_approve = ctx.permissions[m.RDL_INVOICE]?.can_update;

            if(!can_approve) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve invoices." 
                });
            }

            try {
                const userLevel = ctx.user.level_id;
                const userDepartment = ctx.user.department_id;
                const isAdmin = userLevel === ADMIN_LEVEL_ID && userDepartment === ADMIN_DEPARTMENT_ID;

                const can_approve = await ctx.db.$queryRaw<{ can_approve: boolean }[]>`
                    SELECT 
                        1 as can_approve
                    FROM AUTHORIZATIONS
                    WHERE module_id = ${m.RDL_INVOICE}
                        AND level_id = ${userLevel}
                        AND department_id = ${userDepartment}
                    LIMIT 1;
                `;

                if (can_approve.length === 0 && !isAdmin) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to Authorize this Invoice.",
                    });
                }

                const updatedInvoice = await ctx.db.rdl_invoice.update({
                    where: { id: input.id },
                    data: {
                        is_authorized: input.approval_status,
                    }
                });

                await ctx.db.rdl_invoice_history.create({
                    data: {
                        rdl_invoice_id: updatedInvoice.id,
                        is_authorized: updatedInvoice.is_authorized,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    }
                });

                return updatedInvoice;
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
            const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

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
                                rdl_invoice: {
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
                        message: "You do not have permission to view this Invoice." 
                    });
                }

                const data = await ctx.db.rdl_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        invoice_no: true,
                        invoice_date: true,
                        discount: true,
                        pi_no: true,
                        container_no: true,
                        contact_no: true,
                        terms: {
                            select: { name: true },
                        },
                        buyers: {
                            select: {
                                buyer_name: true,
                                address: true,
                            }
                        },
                        rdl_invoice_details: {
                            select: {
                                factory_invoice: {
                                    select: {
                                        shipment_mode: true,
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
                                        factory_invoice_consignee: {
                                            select: {
                                                buyer_consignee: {
                                                    select: {
                                                        id: true,
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
                                                        id: true,
                                                        consignee_name: true,
                                                        address: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
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
                                },
                                companies: {
                                    select: {
                                        name: true,
                                        street: true,
                                        city: true,
                                        zip_code: true,
                                    }
                                }
                            }
                        },
                        lc_master: {
                            select: {
                                lc_no: true,
                                lc_open_date: true,
                                lc_orders: {
                                    select: {
                                        buyer_orders: {
                                            select: {
                                                sales_contract_details: {
                                                    select: {
                                                        sales_contracts: {
                                                            select: {
                                                                destinations: {
                                                                    select: {
                                                                        name: true,
                                                                    }
                                                                },
                                                                companies: {
                                                                    select: {
                                                                        name: true,
                                                                        street: true,
                                                                        city: true,
                                                                        zip_code: true,
                                                                    }
                                                                },
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                    }
                });

                const consignees = Array.from(
                    new Map(
                        data?.rdl_invoice_details?.[0]?.factory_invoice?.factory_invoice_consignee.map(x => [
                            x.buyer_consignee?.id,
                            x.buyer_consignee,
                        ])
                    ).values()
                );

                const notifyParties = Array.from(
                    new Map(
                        data?.rdl_invoice_details?.[0]?.factory_invoice?.factory_invoice_notify_party.map(x => [
                            x.buyer_consignee?.id,
                            x.buyer_consignee,
                        ])
                    ).values()
                );

                const factoryInvoiceHeader = data ? {
                    company_name: data.sales_contracts?.companies?.name 
                        ?? data.lc_master?.lc_orders?.[0]?.buyer_orders?.sales_contract_details?.[0]?.sales_contracts?.companies?.name 
                        ?? null,
                    company_street: data.sales_contracts?.companies?.street 
                        ?? data.lc_master?.lc_orders?.[0]?.buyer_orders?.sales_contract_details?.[0]?.sales_contracts?.companies?.street 
                        ?? null,
                    company_city: data.sales_contracts?.companies?.city 
                        ?? data.lc_master?.lc_orders?.[0]?.buyer_orders?.sales_contract_details?.[0]?.sales_contracts?.companies?.city 
                        ?? null,
                    company_zip_code: data.sales_contracts?.companies?.zip_code 
                        ?? data.lc_master?.lc_orders?.[0]?.buyer_orders?.sales_contract_details?.[0]?.sales_contracts?.companies?.zip_code 
                        ?? null,
                    buyer_address: data.buyers?.address ?? null,
                    buyer_name: data.buyers?.buyer_name ?? null,
                    invoice_no: data.invoice_no,
                    invoice_date: data.invoice_date,
                    term_name: data.terms?.name ?? null,
                    sales_contract_no: data.sales_contracts?.sales_contract_no ?? null,
                    sales_contract_date: data.sales_contracts?.sales_contract_date ?? null,
                    lc_no: data.lc_master?.lc_no ?? null,
                    lc_open_date: data.lc_master?.lc_open_date ?? null,
                    discount: data.discount,
                    shipment_mode: data.rdl_invoice_details?.[0]?.factory_invoice?.shipment_mode 
                        ?? data.rdl_invoice_details?.[0]?.factory_invoice?.factory_invoice_details?.[0]?.exfactory_shipments?.shipment_details?.shipment_mode,
                    freight_term_name: data.rdl_invoice_details?.[0]?.factory_invoice?.freight_term?.name ?? null,
                    port_of_loading: data.rdl_invoice_details?.[0]?.factory_invoice?.destinations?.name 
                        ?? data.sales_contracts?.destinations?.name
                        ??  data.lc_master?.lc_orders?.[0]?.buyer_orders?.sales_contract_details?.[0]?.sales_contracts?.destinations?.name,
                    pi_no: data.pi_no,
                    container_no: data.container_no,
                    contact_no: data.contact_no,
                    consignees: consignees,
                    notify_parties: notifyParties,
                    final_destination: data.rdl_invoice_details?.[0]?.factory_invoice?.factory_invoice_details?.[0]?.exfactory_shipments?.shipment_details?.destinations?.name ?? null,
                } : null;

                const table = await ctx.db.$queryRaw<FactoryInvoicePDFTableItem[]>`
                    SELECT
                        BB.brand,
                        SD.buyer_po,
                        OS.style,
                        RISD.invoice_quantity,
                        sum(RISD.invoice_quantity) OVER () AS total_quantity,
                        SD.fob_rate AS UNIT_PRICE,
                        RISD.invoice_quantity * SD.fob_rate AS total_price,
                        SUM( RISD.invoice_quantity * SD.fob_rate) OVER () AS grand_total,
                        C.symbol
                    FROM rdl_invoice AS RI
                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.ID = OS.order_id
                        INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id
                        INNER JOIN factory_orders AS FO ON FO.ID = FSD.factory_order_id
                        INNER JOIN currencies AS C ON C.id = FO.currency_id
                    WHERE RI.ID = ${input.id};
                `;

                const beneficiaryBankDetails = await ctx.db.$queryRaw<BankDetailsOfBeneficiary[]>`
                    SELECT
                        B.NAME,
                        CB.account_name,
                        CB.account_no,
                        CB.branch_name,
                        CB.address,
	                    CB.swift
                    FROM rdl_invoice AS RI
                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                        INNER JOIN sales_contract_details AS SCD ON SCD.order_id = BO.id
                        INNER JOIN sales_contracts AS SC ON SC.id = SCD.sales_contract_id
                        INNER JOIN company_banks AS CB ON CB.id = SC.rdl_bank_id
                        INNER JOIN banks AS B ON B.id = CB.bank_id
                    WHERE RI.ID = ${input.id}
                    GROUP BY RI.ID, B.ID, CB.ID;
                `;

                const tableWithFormattedValues = table.map(item => ({
                    ...item,
                    total_quantity: quantityFormatter(Number(item.total_quantity)),
                    unit_price: currencyFormatter(Number(item.unit_price), item.symbol),
                    total_price: currencyFormatter(Number(item.total_price), item.symbol),
                    grand_total: currencyFormatter(Number(item.grand_total), item.symbol),
                }));

                const discountedValue = table.length > 0 ? Number(table[0]?.grand_total) - (data?.discount ?? 0) : 0;
                const discountedValueStr = currencyFormatter(discountedValue, table[0]?.symbol ?? '$');

                return {
                    header: factoryInvoiceHeader,
                    beneficiaryBankDetails: beneficiaryBankDetails[0] ?? null, 
                    table: tableWithFormattedValues, 
                    discountedValue: discountedValueStr 
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkIfDocumentSubmissionExists: protectedProcedure
        .input(z.object({
            rdl_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const count = await ctx.db.document_submissions_details.count({
                    where: { rdl_invoice_id: input.rdl_invoice_id },
                });

                return { exists: count > 0 };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});