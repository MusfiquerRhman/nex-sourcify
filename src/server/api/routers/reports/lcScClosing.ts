import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { Charges, ClaimAdjustment, CommissionDistributions, DebitNotes, LcScClosingHeader, LcScTableData } from "./_types/lcScClosing";
import { dividedByZeroSafe, safeNumber } from "~/utils/numbers";
import { formatDate } from "~/utils/localDateString";
import type { CommissionInvoices } from "./_types/commercialActivityReport";

export const lcScClosingRouter = createTRPCRouter({
    getLCs: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            buyerId: z.number().optional()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC/SC Closing Report'
                })
            }

            try {
                let scLcList: { id: string, sc_lc_no: string}[];

                if(input.base === 'LC'){
                    scLcList = await ctx.db.lc_master.findMany({
                        where: {
                            buyer_id:  input.buyerId
                        },
                        select: {
                            id: true,
                            lc_no: true
                        }
                    }).then(results => results.map(
                        item => ({ 
                            id: item.id, 
                            sc_lc_no: item.lc_no 
                        })
                    ))
                }
                else {
                    scLcList = await ctx.db.sales_contracts.findMany({
                        where: {
                            buyer_id: input.buyerId
                        },
                        select: {
                            id: true,
                            sales_contract_no: true
                        }
                    }).then(results => results.map(
                        item => ({ 
                            id: item.id, 
                            sc_lc_no: item.sales_contract_no
                        })
                    ))
                }

                return scLcList;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
    
    getPDFData: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            lcScId: z.string(),
            from_date: z.date().optional(),
            to_date: z.date().optional()
        }))
        .query( async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC/SC Closing Report'
                })
            }

            try {
                const isPartial = !!input.from_date && !!input.to_date;

                let headerData: LcScClosingHeader[] = [];
                let tableData: LcScTableData[] = [];
                let charges: Charges[] = [];
                let claimAdjustment: ClaimAdjustment[] = [];
                let debitNotes: DebitNotes[] = [];
                let commissionDistributions: CommissionDistributions[] = [];
                let commissionInvoices: CommissionInvoices[] = [];

                // LC Closing
                if(input.base === 'LC'){
                    // Parallel Query Processing
                    await Promise.all([
                        headerData = await ctx.db.$queryRaw<LcScClosingHeader[]>`
                            SELECT	
                                LC.lc_no,
                                B.buyer_name,
                                SUM(SID.quantity) AS order_quantity,
                                SUM(SID.quantity * SD.fob_rate / BO.currency_rate) AS value,
                                SUM(SID.quantity * SD.fob_rate) AS secondary_value,
                                C.symbol
                            FROM lc_master AS LC
                                INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                                INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                                INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                                INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                                INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                                INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                INNER JOIN buyers AS B ON B.id = LC.buyer_id
                            WHERE LC.ID = ${input.lcScId}
                            GROUP BY LC.ID, B.ID, C.id;
                        `,

                        tableData = await ctx.db.$queryRaw<LcScTableData[]>`
                            WITH EXFACTORY AS (
                                SELECT
                                    LO.lc_master_id AS E_LC_ID,
                                    MIN(E.exfactory_date) AS MIN_EXFACTORY_DATE,
                                    MAX(E.exfactory_date) AS MAX_EXFACTORY_DATE,
                                    SUM(ES.delivery_quantity) AS EXPORT_INVOICE_QUANTITY,
                                    SUM(ES.delivery_quantity * SD.fob_rate * (1 - COALESCE(ESD.early_settlement_charge, 0) / 100)) AS RDL_EXPORT_VALUE,
                                    SUM(ES.delivery_quantity * SD.fob_rate / BO.currency_rate * (1 - COALESCE(ESD.early_settlement_charge, 0) / 100)) AS RDL_EXPORT_VALUE_USD,
                                    SUM(CASE 
                                        WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                            THEN ES.delivery_quantity * FSD.transfer_rate / BO.currency_rate
                                        ELSE ES.delivery_quantity * FSD.factory_rate / BO.currency_rate
                                    END) AS FACTORY_EXPORT_VALUE,
                                    SUM(CASE 
                                        WHEN COALESCE(FSD.transfer_rate) <> 0
                                            THEN ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) / BO.currency_rate
                                        ELSE 0
                                    END) AS DEBIT_NOTE,
                                    C.symbol
                                FROM lc_orders AS LO
                                INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                                INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                                LEFT JOIN early_settlement_details AS ESD ON ESD.shipment_details_id = SD.id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                                INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                                INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                                ${isPartial ? Prisma.sql`WHERE E.EXFACTORY_DATE BETWEEN ${input.from_date} AND ${input.to_date}` : Prisma.empty}
                                GROUP BY LO.lc_master_id, C.ID
                            ), 
                            PROCEED AS (
                                SELECT
                                    DS.lc_id AS DS_LC_ID,
                                    SUM(PRD.realized_amount) AS REALIZED_AMOUNT
                                FROM document_submissions AS DS
                                INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                                INNER JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                                GROUP BY DS.lc_id
                            ),
                            FACTORY_PAYMENTS AS (
                                SELECT 
                                    DS.lc_id AS DS_LC_ID,
                                    SUM(FP.paid_amount) AS FACTORY_PAID_AMOUNT
                                FROM document_submissions AS DS  
                                    INNER JOIN factory_payments AS FP ON DS.id = FP.document_submission_id
                                GROUP BY DS.lc_id
                            )
                            SELECT	
                                E.MIN_EXFACTORY_DATE,
                                E.MAX_EXFACTORY_DATE,
                                E.EXPORT_INVOICE_QUANTITY,
                                E.RDL_EXPORT_VALUE,
                                E.RDL_EXPORT_VALUE_USD,
                                E.FACTORY_EXPORT_VALUE,
                                E.symbol,
                                E.DEBIT_NOTE,
                                p.REALIZED_AMOUNT,
                                F.FACTORY_PAID_AMOUNT
                            FROM lc_master AS LC
                                INNER JOIN EXFACTORY AS E ON E.E_LC_ID = LC.ID
                                INNER JOIN PROCEED AS P ON P.DS_LC_ID = LC.ID
                                INNER JOIN FACTORY_PAYMENTS AS F ON F.DS_LC_ID = LC.ID
                            WHERE LC.ID = ${input.lcScId}
                            GROUP BY LC.ID, 
                                E.MIN_EXFACTORY_DATE,
                                E.MAX_EXFACTORY_DATE,
                                E.EXPORT_INVOICE_QUANTITY,
                                E.RDL_EXPORT_VALUE,
                                E.RDL_EXPORT_VALUE_USD,
                                E.FACTORY_EXPORT_VALUE,
                                E.symbol,
                                E.DEBIT_NOTE,
                                p.REALIZED_AMOUNT,
                                F.FACTORY_PAID_AMOUNT;
                        `,

                        charges = await ctx.db.$queryRaw<Charges[]>`
                            SELECT
                                COALESCE(SUM(PR.bank_charge), 0) AS bank_charge,
                                COALESCE(SUM(PR.discount_charge), 0) AS discount_charge,
                                COALESCE(SUM(PR.document_charge), 0) AS document_charge
                            FROM document_submissions AS DS
                            INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                            WHERE DS.lc_id = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM proceed_realization_details AS PRD
                                        INNER JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
                                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                        INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE PRD.realization_id = PR.id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty};
                        `,

                        claimAdjustment = await ctx.db.$queryRaw<ClaimAdjustment[]>`
                            SELECT 
                                COALESCE(SUM(RI.discount), 0) AS CLAIM_ADJUSTMENT
                            FROM rdl_invoice AS RI
                            WHERE RI.lc_id = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM rdl_invoice_details AS RID
                                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                        INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE RID.rdl_invoice_id = RI.id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty};
                        `,

                        debitNotes = await ctx.db.$queryRaw<DebitNotes[]>`
                            SELECT 
                                DN.debit_note_ref,
                                DN.debit_note_date,
                                SUM(ES.delivery_quantity * (FSD.TRANSFER_RATE - FSD.FACTORY_RATE)) AS DEBIT_NOTE_VALUE,
                                F.name AS FACTORY_NAME
                            FROM debit_note AS DN
                                INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                                INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                                INNER JOIN factories AS F ON F.id = DN.factory_id
                            WHERE DN.lc_id = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM exfactory_orders AS EO
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE EO.id = ES.exfactory_orders_id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty}
                            GROUP BY DN.id, F.id;
                        `,

                        commissionDistributions = await ctx.db.$queryRaw<CommissionDistributions[]>`
                            WITH INV AS (
                                SELECT
                                    RISD.rdl_invoice_details_id AS RIDID,
                                    ES.shipment_details_id AS SDID,
                                    SUM(RISD.invoice_quantity) AS INVOICE_QUANTITY
                                FROM rdl_invoice_shipment_details RISD
                                    INNER JOIN factory_invoice_details FID ON FID.id = RISD.factory_invoice_details_id
                                    INNER JOIN exfactory_shipments ES ON ES.id = FID.exfactory_shipment_id
                                ${isPartial ? Prisma.sql`
                                    WHERE EXISTS (
                                        SELECT 1
                                        FROM exfactory_orders AS EO
                                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                        WHERE EO.id = ES.exfactory_orders_id
                                            AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                    )
                                ` : Prisma.empty}
                                GROUP BY RISD.rdl_invoice_details_id, ES.shipment_details_id
                            ),
                            SHIPMENT_CALC AS (
                                SELECT
                                    SD.id AS shipment_detail_id,
                                    SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1) AS FOB_RATE,
                                    FSD.FACTORY_RATE,
                                    COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) AS EARLY_SETTLEMENT_CHARGE,
                                    COALESCE(CDD.DHAKA_COMMISSION_PERCENTAGE, 0) AS DHAKA_COMMISSION_PERCENTAGE,
                                    COALESCE(CDD.OTHERS_COMMISSION_PERCENTAGE, 0) AS OTHERS_COMMISSION_PERCENTAGE,
                                    COALESCE(CDD.OVERSEAS_COMMISSION_PERCENTAGE, 0) AS OVERSEAS_COMMISSION_PERCENTAGE,
                                    (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100) AS EFFECTIVE_FOB,
                                    (
                                        (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100) - FSD.FACTORY_RATE
                                    ) * 100 / NULLIF(
                                        (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100), 0
                                    ) AS EFFECTIVE_COMMISSION_PERCENTAGE
                                FROM shipment_details SD
                                    INNER JOIN order_styles OS ON OS.id = SD.order_style_id
                                    INNER JOIN buyer_orders BO ON BO.id = OS.order_id
                                    INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
                                    INNER JOIN commission_distributions_details CDD ON CDD.shipment_details_id = SD.id
                                    LEFT JOIN early_settlement_details ESD ON ESD.shipment_details_id = SD.id
                            ),
                            CI_FOR_LC AS (
                                SELECT
                                    DS.id AS DS_ID,
                                    SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE) AS TOTAL_RDL_VALUE,
                                    SUM(INV.INVOICE_QUANTITY * (SC.EFFECTIVE_FOB - SC.FACTORY_RATE)) AS TOTAL_CI,
                                    COALESCE(SUM(
                                        INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB *
                                        (SC.EFFECTIVE_COMMISSION_PERCENTAGE - SC.OTHERS_COMMISSION_PERCENTAGE - SC.OVERSEAS_COMMISSION_PERCENTAGE) / 100
                                    ), 0) AS TOTAL_DHAKA_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB * SC.OTHERS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OTHER_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB * SC.OVERSEAS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OVERSEAS_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.DHAKA_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_DHAKA_CI_ORIGINAL,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.OTHERS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OTHER_CI_ORIGINAL,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.OVERSEAS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OVERSEAS_CI_ORIGINAL
                                FROM document_submissions DS
                                INNER JOIN document_submissions_details DSD ON DSD.document_submissions_id = DS.id
                                INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                                INNER JOIN INV ON INV.RIDID = RID.id
                                INNER JOIN SHIPMENT_CALC SC ON SC.shipment_detail_id = INV.SDID
                                GROUP BY DS.id
                            )
                            SELECT
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_DHAKA_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS DHAKA_VALUE,
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_OVERSEAS_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS OVERSEAS_VALUE,
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_OTHER_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS OTHER_VALUE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_DHAKA_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS DHAKA_PERCENTAGE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_OVERSEAS_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS OVERSEAS_PERCENTAGE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_OTHER_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS OTHER_PERCENTAGE
                            FROM document_submissions AS DS
                                LEFT JOIN CI_FOR_LC CFL ON CFL.DS_ID = DS.id
                            WHERE DS.lc_id = ${input.lcScId};
                        `,

                        commissionInvoices = await ctx.db.$queryRaw<CommissionInvoices[]>`
                            WITH 
                            ${isPartial ? Prisma.sql`
                                EXFACTORY_FILTER AS (
                                    SELECT 
                                        ES.SHIPMENT_DETAILS_ID
                                    FROM exfactory AS E
                                        INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.id 
                                    WHERE E.EXFACTORY_DATE BETWEEN ${input.from_date} AND ${input.to_date}
                                    GROUP BY ES.SHIPMENT_DETAILS_ID
                                ),
                            ` : Prisma.empty}
                            RDL AS (
                                SELECT
                                    DSD.document_submissions_id AS DS_ID,
                                    DSD.rdl_invoice_id AS RI_ID,
                                    SUM(RISD.invoice_quantity * SD.fob_rate) AS RDL_VALUE,
                                    SUM(RISD.invoice_quantity * SD.fob_rate * COALESCE(ESD.early_settlement_charge, 0) / 100) AS ESS_VALUE
                                FROM document_submissions_details DSD
                                INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                                INNER JOIN rdl_invoice_shipment_details RISD ON RISD.rdl_invoice_details_id = RID.id
                                INNER JOIN shipment_details SD ON SD.id = RISD.shipment_details_id
                                LEFT JOIN early_settlement_details ESD ON ESD.shipment_details_id = SD.id
                                ${isPartial ? Prisma.sql`
                                    INNER JOIN EXFACTORY_FILTER AS EF ON EF.SHIPMENT_DETAILS_ID = RISD.shipment_details_id
                                ` : Prisma.empty}
                                GROUP BY DSD.document_submissions_id, DSD.rdl_invoice_id
                            ),
                            FACTORY AS (
                                SELECT
                                    DSD.document_submissions_id AS DS_ID,
                                    RID.rdl_invoice_id AS RI_ID,
                                    SUM(RISD.invoice_quantity * FSD.transfer_rate) AS FACTORY_VALUE
                                FROM document_submissions_details DSD
                                INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                                INNER JOIN rdl_invoice_shipment_details RISD ON RISD.rdl_invoice_details_id = RID.id
                                INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = RISD.shipment_details_id
                                ${isPartial ? Prisma.sql`
                                    INNER JOIN EXFACTORY_FILTER AS EF ON EF.SHIPMENT_DETAILS_ID = RISD.shipment_details_id
                                ` : Prisma.empty}
                                GROUP BY DSD.document_submissions_id, RID.rdl_invoice_id
                            ),
                            RI AS (
                                SELECT
                                    RI.id AS RI_ID,
                                    RI.discount,
                                    RDL.DS_ID,
                                    RDL.RDL_VALUE,
                                    RDL.ESS_VALUE,
                                    FACTORY.FACTORY_VALUE
                                FROM rdl_invoice RI
                                INNER JOIN RDL ON RDL.RI_ID = RI.id
                                LEFT JOIN FACTORY ON FACTORY.RI_ID = RI.id AND FACTORY.DS_ID = RDL.DS_ID
                            )
                            SELECT
                                CI.ref_no,
                                CI.invoice_date,
                                SUM( RI.RDL_VALUE - RI.ESS_VALUE - COALESCE(RI.discount, 0) - COALESCE(RI.FACTORY_VALUE, 0)) AS invoice_value
                            FROM commission_invoice CI
                            INNER JOIN terms T ON T.id = CI.term_id
                            INNER JOIN RI ON RI.DS_ID = CI.document_submission_id
                            WHERE CI.lc_id = ${input.lcScId}
                            GROUP BY CI.ref_no, CI.invoice_date;
                        `
                    ]);
                }
                // Sales Contract Closing
                else {
                    await Promise.all([
                        headerData = await ctx.db.$queryRaw<LcScClosingHeader[]>`
                            SELECT	
                                SC.sales_contract_no AS lc_no,
                                B.buyer_name,
                                SUM(SID.quantity) AS order_quantity,
                                SUM(SID.quantity * SD.fob_rate / BO.currency_rate) AS value,
                                SUM(SID.quantity * SD.fob_rate) AS secondary_value,
                                C.symbol
                            FROM sales_contracts AS SC
                                INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                                INNER JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                                INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                                INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                                INNER JOIN buyers AS B ON B.id = SC.buyer_id
                            WHERE SC.ID =  ${input.lcScId}
                            GROUP BY SC.ID, B.ID, C.id;
                        `,

                        tableData = await ctx.db.$queryRaw<LcScTableData[]>`
                            WITH EXFACTORY AS (
                                SELECT
                                    SCD.SALES_CONTRACT_ID AS E_SC_ID,
                                    MIN(E.exfactory_date) AS MIN_EXFACTORY_DATE,
                                    MAX(E.exfactory_date) AS MAX_EXFACTORY_DATE,
                                    SUM(ES.delivery_quantity) AS EXPORT_INVOICE_QUANTITY,
                                    SUM(ES.delivery_quantity * SD.fob_rate * (1 - COALESCE(ESD.early_settlement_charge, 0) / 100)) AS RDL_EXPORT_VALUE,
                                    SUM(ES.delivery_quantity * SD.fob_rate / BO.currency_rate * (1 - COALESCE(ESD.early_settlement_charge, 0) / 100)) AS RDL_EXPORT_VALUE_USD,
                                    SUM(CASE 
                                        WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                            THEN ES.delivery_quantity * FSD.transfer_rate / BO.currency_rate
                                        ELSE ES.delivery_quantity * FSD.factory_rate / BO.currency_rate
                                    END) AS FACTORY_EXPORT_VALUE,
                                    SUM(CASE 
                                        WHEN COALESCE(FSD.transfer_rate) <> 0
                                            THEN ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) / BO.currency_rate
                                        ELSE 0
                                    END) AS DEBIT_NOTE,
                                    C.symbol
                                FROM sales_contract_details AS SCD
                                INNER JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                                INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                                INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                LEFT JOIN early_settlement_details AS ESD ON ESD.shipment_details_id = SD.id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                                INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                                ${isPartial ? Prisma.sql`WHERE E.EXFACTORY_DATE BETWEEN ${input.from_date} AND ${input.to_date}` : Prisma.empty}
                                GROUP BY SCD.SALES_CONTRACT_ID, C.ID
                            ), 
                            PROCEED AS (
                                SELECT
                                    DS.SALES_CONTRACT_ID AS DS_SC_ID,
                                    SUM(PRD.realized_amount) AS REALIZED_AMOUNT
                                FROM document_submissions AS DS
                                INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                                INNER JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                                GROUP BY DS.SALES_CONTRACT_ID
                            ),
                            FACTORY_PAYMENTS AS (
                                SELECT 
                                    DS.SALES_CONTRACT_ID AS DS_SC_ID,
                                    SUM(FP.paid_amount) AS FACTORY_PAID_AMOUNT
                                FROM document_submissions AS DS  
                                    INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                                    INNER JOIN factory_payments AS FP ON DSD.rdl_invoice_id = FP.rdl_invoice_id
                                GROUP BY DS.SALES_CONTRACT_ID
                            )
                            SELECT	
                                E.MIN_EXFACTORY_DATE,
                                E.MAX_EXFACTORY_DATE,
                                E.EXPORT_INVOICE_QUANTITY,
                                E.RDL_EXPORT_VALUE,
                                E.RDL_EXPORT_VALUE_USD,
                                E.FACTORY_EXPORT_VALUE,
                                E.symbol,
                                E.DEBIT_NOTE,
                                p.REALIZED_AMOUNT,
                                F.FACTORY_PAID_AMOUNT
                            FROM sales_contracts AS SC
                                INNER JOIN EXFACTORY AS E ON E.E_SC_ID = SC.ID
                                INNER JOIN PROCEED AS P ON P.DS_SC_ID = SC.ID
                                INNER JOIN FACTORY_PAYMENTS AS F ON F.DS_SC_ID = SC.ID
                            WHERE SC.ID = ${input.lcScId}
                            GROUP BY SC.ID, 
                                E.MIN_EXFACTORY_DATE,
                                E.MAX_EXFACTORY_DATE,
                                E.EXPORT_INVOICE_QUANTITY,
                                E.RDL_EXPORT_VALUE,
                                E.RDL_EXPORT_VALUE_USD,
                                E.FACTORY_EXPORT_VALUE,
                                E.symbol,
                                E.DEBIT_NOTE,
                                p.REALIZED_AMOUNT,
                                F.FACTORY_PAID_AMOUNT;
                        `,

                        charges = await ctx.db.$queryRaw<Charges[]>`
                            SELECT
                                COALESCE(SUM(PR.bank_charge), 0) AS bank_charge,
                                COALESCE(SUM(PR.discount_charge), 0) AS discount_charge,
                                COALESCE(SUM(PR.document_charge), 0) AS document_charge
                            FROM document_submissions AS DS
                            INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                            WHERE DS.sales_contract_id = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM proceed_realization_details AS PRD
                                        INNER JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
                                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                        INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE PRD.realization_id = PR.id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty};
                        `,

                        claimAdjustment = await ctx.db.$queryRaw<ClaimAdjustment[]>`
                            SELECT 
                                COALESCE(SUM(RI.discount), 0) AS CLAIM_ADJUSTMENT
                            FROM rdl_invoice AS RI
                            WHERE RI.SALES_CONTRACT_ID = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM rdl_invoice_details AS RID
                                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                        INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE RID.rdl_invoice_id = RI.id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty};
                        `,

                        debitNotes = await ctx.db.$queryRaw<DebitNotes[]>`
                            SELECT 
                                DN.debit_note_ref,
                                DN.debit_note_date,
                                SUM(ES.delivery_quantity * (FSD.TRANSFER_RATE - FSD.FACTORY_RATE)) AS DEBIT_NOTE_VALUE,
                                F.name AS FACTORY_NAME
                            FROM debit_note AS DN
                                INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                                INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                                INNER JOIN factories AS F ON F.id = DN.factory_id
                            WHERE DN.SALES_CONTRACT_ID = ${input.lcScId}
                            ${isPartial ? Prisma.sql`
                                AND EXISTS (
                                    SELECT 1
                                    FROM exfactory_orders AS EO
                                        INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                    WHERE EO.id = ES.exfactory_orders_id
                                        AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                )
                            ` : Prisma.empty}
                            GROUP BY DN.id, F.id;
                        `,

                        commissionDistributions = await ctx.db.$queryRaw<CommissionDistributions[]>`
                            WITH INV AS (
                                SELECT
                                    RISD.rdl_invoice_details_id AS RIDID,
                                    ES.shipment_details_id AS SDID,
                                    SUM(RISD.invoice_quantity) AS INVOICE_QUANTITY
                                FROM rdl_invoice_shipment_details RISD
                                    INNER JOIN factory_invoice_details FID ON FID.id = RISD.factory_invoice_details_id
                                    INNER JOIN exfactory_shipments ES ON ES.id = FID.exfactory_shipment_id
                                ${isPartial ? Prisma.sql`
                                    WHERE EXISTS (
                                        SELECT 1
                                        FROM exfactory_orders AS EO
                                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                                        WHERE EO.id = ES.exfactory_orders_id
                                            AND E.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                                    )
                                ` : Prisma.empty}
                                GROUP BY RISD.rdl_invoice_details_id, ES.shipment_details_id
                            ),
                            SHIPMENT_CALC AS (
                                SELECT
                                    SD.id AS shipment_detail_id,
                                    SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1) AS FOB_RATE,
                                    FSD.FACTORY_RATE,
                                    COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) AS EARLY_SETTLEMENT_CHARGE,
                                    COALESCE(CDD.DHAKA_COMMISSION_PERCENTAGE, 0) AS DHAKA_COMMISSION_PERCENTAGE,
                                    COALESCE(CDD.OTHERS_COMMISSION_PERCENTAGE, 0) AS OTHERS_COMMISSION_PERCENTAGE,
                                    COALESCE(CDD.OVERSEAS_COMMISSION_PERCENTAGE, 0) AS OVERSEAS_COMMISSION_PERCENTAGE,
                                    (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100) AS EFFECTIVE_FOB,
                                    (
                                        (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100) - FSD.FACTORY_RATE
                                    ) * 100 / NULLIF(
                                        (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1)) * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100), 0
                                    ) AS EFFECTIVE_COMMISSION_PERCENTAGE
                                FROM shipment_details SD
                                    INNER JOIN order_styles OS ON OS.id = SD.order_style_id
                                    INNER JOIN buyer_orders BO ON BO.id = OS.order_id
                                    INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
                                    INNER JOIN commission_distributions_details CDD ON CDD.shipment_details_id = SD.id
                                    LEFT JOIN early_settlement_details ESD ON ESD.shipment_details_id = SD.id
                            ),
                            CI_FOR_LC AS (
                                SELECT
                                    DS.id AS DS_ID,
                                    SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE) AS TOTAL_RDL_VALUE,
                                    SUM(INV.INVOICE_QUANTITY * (SC.EFFECTIVE_FOB - SC.FACTORY_RATE)) AS TOTAL_CI,
                                    COALESCE(SUM(
                                        INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB *
                                        (SC.EFFECTIVE_COMMISSION_PERCENTAGE - SC.OTHERS_COMMISSION_PERCENTAGE - SC.OVERSEAS_COMMISSION_PERCENTAGE) / 100
                                    ), 0) AS TOTAL_DHAKA_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB * SC.OTHERS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OTHER_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB * SC.OVERSEAS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OVERSEAS_CI,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.DHAKA_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_DHAKA_CI_ORIGINAL,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.OTHERS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OTHER_CI_ORIGINAL,
                                    COALESCE(SUM(INV.INVOICE_QUANTITY * SC.FOB_RATE * SC.OVERSEAS_COMMISSION_PERCENTAGE / 100), 0) AS TOTAL_OVERSEAS_CI_ORIGINAL
                                FROM document_submissions DS
                                INNER JOIN document_submissions_details DSD ON DSD.document_submissions_id = DS.id
                                INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                                INNER JOIN INV ON INV.RIDID = RID.id
                                INNER JOIN SHIPMENT_CALC SC ON SC.shipment_detail_id = INV.SDID
                                GROUP BY DS.id
                            )
                            SELECT
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_DHAKA_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS DHAKA_VALUE,
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_OVERSEAS_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS OVERSEAS_VALUE,
                                SUM(CFL.TOTAL_CI * (CFL.TOTAL_OTHER_CI / NULLIF(CFL.TOTAL_DHAKA_CI + CFL.TOTAL_OTHER_CI + CFL.TOTAL_OVERSEAS_CI, 0))) AS OTHER_VALUE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_DHAKA_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS DHAKA_PERCENTAGE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_OVERSEAS_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS OVERSEAS_PERCENTAGE,
                                SUM(
                                    CFL.TOTAL_CI *(CFL.TOTAL_OTHER_CI / NULLIF(CFL.TOTAL_DHAKA_CI +CFL.TOTAL_OTHER_CI +CFL.TOTAL_OVERSEAS_CI,0))
                                ) / NULLIF(SUM(CFL.TOTAL_RDL_VALUE), 0) * 100 AS OTHER_PERCENTAGE
                            FROM document_submissions AS DS
                                LEFT JOIN CI_FOR_LC CFL ON CFL.DS_ID = DS.id
                            WHERE DS.SALES_CONTRACT_ID = ${input.lcScId};
                        `,

                        commissionInvoices = await ctx.db.$queryRaw<CommissionInvoices[]>`
                            WITH 
                            ${isPartial ? Prisma.sql`
                                EXFACTORY_FILTER AS (
                                    SELECT 
                                        ES.SHIPMENT_DETAILS_ID
                                    FROM exfactory AS E
                                        INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                                        INNER JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.id 
                                    WHERE E.EXFACTORY_DATE BETWEEN ${input.from_date} AND ${input.to_date}
                                    GROUP BY ES.SHIPMENT_DETAILS_ID
                                ),
                            ` : Prisma.empty}
                            RDL AS (
                                SELECT
                                    RID.rdl_invoice_id AS RI_ID,
                                    SUM(RISD.invoice_quantity * SD.fob_rate) AS RDL_VALUE,
                                    SUM(RISD.invoice_quantity * SD.fob_rate * COALESCE(ESD.early_settlement_charge, 0) / 100) AS ESS_VALUE
                                FROM rdl_invoice_details RID
                                INNER JOIN rdl_invoice_shipment_details RISD ON RISD.rdl_invoice_details_id = RID.id
                                INNER JOIN shipment_details SD ON SD.id = RISD.shipment_details_id
                                LEFT JOIN early_settlement_details ESD ON ESD.shipment_details_id = SD.id
                                ${isPartial ? Prisma.sql`
                                    INNER JOIN EXFACTORY_FILTER AS EF ON EF.SHIPMENT_DETAILS_ID = RISD.shipment_details_id
                                ` : Prisma.empty}
                                GROUP BY RID.rdl_invoice_id
                            ),
                            FACTORY AS (
                                SELECT
                                    RID.rdl_invoice_id AS RI_ID,
                                    SUM(
                                        CASE 
                                            WHEN FSD.transfer_rate <> 0
                                                THEN RISD.invoice_quantity * FSD.transfer_rate
                                            ELSE RISD.invoice_quantity * FSD.FACTORY_RATE
                                    END) AS FACTORY_VALUE
                                FROM rdl_invoice_details RID
                                INNER JOIN rdl_invoice_shipment_details RISD ON RISD.rdl_invoice_details_id = RID.id
                                INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = RISD.shipment_details_id
                                ${isPartial ? Prisma.sql`
                                    INNER JOIN EXFACTORY_FILTER AS EF ON EF.SHIPMENT_DETAILS_ID = RISD.shipment_details_id
                                ` : Prisma.empty}
                                GROUP BY RID.rdl_invoice_id
                            ),
                            RI AS (
                                SELECT
                                    RI.id AS RI_ID,
                                    RI.discount,
                                    RDL.RDL_VALUE,
                                    RDL.ESS_VALUE,
                                    FACTORY.FACTORY_VALUE
                                FROM rdl_invoice RI
                                INNER JOIN RDL ON RDL.RI_ID = RI.id
                                LEFT JOIN FACTORY ON FACTORY.RI_ID = RI.id
                            )
                            SELECT
                                CI.ref_no,
                                CI.invoice_date,
                                SUM(RI.RDL_VALUE - RI.ESS_VALUE - COALESCE(RI.discount, 0) - COALESCE(RI.FACTORY_VALUE, 0)) AS invoice_value
                            FROM commission_invoice CI
                            INNER JOIN terms T ON T.id = CI.term_id
                            INNER JOIN RI ON RI.RI_ID = CI.rdl_invoice_id
                            WHERE CI.sales_contract_id = ${input.lcScId}
                            GROUP BY CI.ref_no, CI.invoice_date;
                        `
                    ])
                }

                const header = headerData.length > 0 ? {
                    lc_no: headerData[0]?.lc_no,
                    buyer_name: headerData[0]?.buyer_name,
                    quantity: quantityFormatter(safeNumber(headerData[0]?.order_quantity)),
                    value: currencyFormatter(safeNumber(headerData[0]?.value), '$'),
                    ...(headerData[0]?.symbol !== '$' && {
                        secondary_value: currencyFormatter(
                            safeNumber(headerData[0]?.secondary_value),
                            headerData[0]?.symbol ?? '$'
                        )
                    })
                } : null;

                const minYear = tableData[0]?.min_exfactory_date.toDateString().split(' ')[3];
                const maxYear = tableData[0]?.max_exfactory_date.toDateString().split(' ')[3];

                const invoicePeriod = minYear === maxYear ? minYear : `${minYear} - ${maxYear}`;

                const commission = safeNumber(tableData[0]?.rdl_export_value_usd) - safeNumber(tableData[0]?.factory_export_value);
                const commission_percentage = dividedByZeroSafe(commission, safeNumber(tableData[0]?.rdl_export_value_usd)) * 100;

                const commission_realized = safeNumber(tableData[0]?.realized_amount) - safeNumber(tableData[0]?.factory_paid_amount);
                
                const commission_realized_percentage = dividedByZeroSafe(
                    commission_realized, safeNumber(tableData[0]?.rdl_export_value_usd)
                ) * 100;

                const debit_note = safeNumber(tableData[0]?.debit_note);

                const total_calculated_commission = commission + debit_note; 

                const total_calculated_commission_percentage = dividedByZeroSafe(
                    total_calculated_commission, safeNumber(tableData[0]?.rdl_export_value_usd)
                ) * 100;

                const total_commission_realized = commission_realized + debit_note;  

                const total_commission_realized_percentage = dividedByZeroSafe(
                    total_commission_realized, safeNumber(tableData[0]?.rdl_export_value_usd)
                ) * 100;

                const table = tableData.length > 0 ? {
                    invoice_period: invoicePeriod,
                    export_invoice_quantity: quantityFormatter(safeNumber(tableData[0]?.export_invoice_quantity)),
                    ...(tableData[0]?.symbol !== '$' && {
                        invoice_value: currencyFormatter(safeNumber(tableData[0]?.rdl_export_value), tableData[0]?.symbol ?? '$')
                    }),
                    invoice_value_usd: currencyFormatter(safeNumber(tableData[0]?.rdl_export_value_usd), '$'),
                    factory_export_value: currencyFormatter(safeNumber(tableData[0]?.factory_export_value), '$'),
                    calculated_commission: currencyFormatter(commission, '$'),
                    calculated_commission_percentage: `${quantityFormatter(commission_percentage)}%`,
                    proceed: currencyFormatter(safeNumber(tableData[0]?.realized_amount), '$'),
                    factory_payment: currencyFormatter(safeNumber(tableData[0]?.factory_paid_amount), '$'),
                    commission_realized: currencyFormatter(commission_realized, '$'),
                    commission_realized_percentage: `${quantityFormatter(commission_realized_percentage)}%`,
                    debit_note: currencyFormatter(debit_note, '$'),
                } : null;

                const table_summary = {
                    total_calculated_commission: currencyFormatter(total_calculated_commission, '$'),
                    total_calculated_commission_percentage: `${quantityFormatter(total_calculated_commission_percentage)}%`,
                    total_commission_realized: currencyFormatter(total_commission_realized, '$'),
                    total_commission_realized_percentage: `${quantityFormatter(total_commission_realized_percentage)}%`
                }

                const gain_lose = ( - (
                    safeNumber(tableData[0]?.rdl_export_value_usd) - safeNumber(tableData[0]?.realized_amount)
                ) + (
                    safeNumber(charges[0]?.bank_charge) + 
                    safeNumber(charges[0]?.document_charge) + 
                    safeNumber(charges[0]?.discount_charge) +
                    safeNumber(claimAdjustment[0]?.claim_adjustment)
                ));

                const reduction_in_factory_payment = safeNumber(tableData[0]?.factory_export_value) - safeNumber(tableData[0]?.factory_paid_amount);

                const chargesTable = {
                    bank_charge: currencyFormatter(safeNumber(charges[0]?.bank_charge), '$'),
                    document_charge: currencyFormatter(safeNumber(charges[0]?.document_charge), '$'),
                    discount_charge: currencyFormatter(safeNumber(charges[0]?.discount_charge), '$'),
                    claim_adjustment: currencyFormatter(safeNumber(claimAdjustment[0]?.claim_adjustment), '$'),
                    gain_lose: currencyFormatter(gain_lose, '$'),
                    reduction_in_factory_payment: currencyFormatter(reduction_in_factory_payment, '$'),
                    total: currencyFormatter(
                        reduction_in_factory_payment - gain_lose -
                        safeNumber(charges[0]?.bank_charge) -
                        safeNumber(charges[0]?.document_charge) -
                        safeNumber(charges[0]?.discount_charge) -
                        safeNumber(claimAdjustment[0]?.claim_adjustment), 
                        '$'
                    )
                }

                const difference_between_commissions = currencyFormatter(Math.abs(total_calculated_commission - total_commission_realized), '$');

                const debitNotesTable = debitNotes.map((item) => ({
                    ...item,
                    debit_note_value: currencyFormatter(safeNumber(item.debit_note_value), '$'),
                    debit_note_date: formatDate(item.debit_note_date)
                }));

                const commissionInvoiceTable = commissionInvoices.map((item) => ({
                    ...item,
                    invoice_date: formatDate(item.invoice_date),
                    invoice_value: currencyFormatter(safeNumber(item.invoice_value), '$'),
                }))

                const totalPercentageOfCommission = safeNumber(commissionDistributions[0]?.dhaka_percentage)
                    + safeNumber(commissionDistributions[0]?.overseas_percentage)
                    + safeNumber(commissionDistributions[0]?.other_percentage);

                const percentageOfDhakaCommission = safeNumber(commissionDistributions[0]?.dhaka_percentage) / totalPercentageOfCommission;
                const percentageOfOverseasCommission = safeNumber(commissionDistributions[0]?.overseas_percentage) / totalPercentageOfCommission;

                const actualDhakaCommission = total_commission_realized 
                    - safeNumber(commissionDistributions[0]?.overseas_value) 
                    - safeNumber(commissionDistributions[0]?.other_value);

                const commissionTable = {
                    dhaka_value: currencyFormatter(safeNumber(commissionDistributions[0]?.dhaka_value), '$'),
                    overseas_value: currencyFormatter(safeNumber(commissionDistributions[0]?.overseas_value), '$'),
                    other_value: currencyFormatter(safeNumber(commissionDistributions[0]?.other_value), '$'),

                    dhaka_percentage: `${quantityFormatter(safeNumber(commissionDistributions[0]?.dhaka_percentage))}%`,
                    overseas_percentage: `${quantityFormatter(safeNumber(commissionDistributions[0]?.overseas_percentage))}%`,
                    other_percentage: `${quantityFormatter(safeNumber(commissionDistributions[0]?.other_percentage))}%`,

                    percentage_of_dhaka_commission: `${quantityFormatter(percentageOfDhakaCommission * 100)}%`,
                    percentage_of_overseas_commission: `${quantityFormatter(percentageOfOverseasCommission * 100)}%`,
                    percentage_of_other_commission: `${quantityFormatter(
                        safeNumber(commissionDistributions[0]?.other_percentage) * 100 / totalPercentageOfCommission
                    )}%`,

                    dhaka_actual_commission: currencyFormatter(actualDhakaCommission, '$'),
                    overseas_actual_commission: currencyFormatter(safeNumber(commissionDistributions[0]?.overseas_value), '$'),
                    other_actual_commission: currencyFormatter(safeNumber(commissionDistributions[0]?.other_value), '$'),
                    
                    actual_dhaka_commission_percentage: `${quantityFormatter(
                        actualDhakaCommission * 100 / safeNumber(tableData[0]?.rdl_export_value_usd)
                    )}%`, 

                    actual_overseas_commission_percentage: `${quantityFormatter(
                        safeNumber(commissionDistributions[0]?.overseas_value) * 100 / safeNumber(tableData[0]?.rdl_export_value_usd)
                    )}%`, 

                    actual_other_commission_percentage: `${quantityFormatter(
                        safeNumber(commissionDistributions[0]?.other_value) * 100 / safeNumber(tableData[0]?.rdl_export_value_usd)
                    )}%`, 
                }

                return { 
                    header, 
                    table, 
                    table_summary, 
                    chargesTable,
                    difference_between_commissions,
                    debitNotesTable,
                    commissionTable,
                    commissionInvoiceTable
                }
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})

