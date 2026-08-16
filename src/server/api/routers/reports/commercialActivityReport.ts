import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { generateActivityReportExcel } from "../../../_utils/excel/commercial_activity_report_excel/generateActivityReport";
import { safeNumber } from "~/utils/numbers";
import type { PoWiseData, CiAndRealizationData, FactoryInvoiceData } from "./_types/commercialActivityReport";

const normalizePoWiseData = (row: PoWiseData): PoWiseData => ({
    ...row,
    shipment_quantity: safeNumber(row.shipment_quantity),
    factory_invoice_quantity: safeNumber(row.factory_invoice_quantity),
    factory_invoice_value: safeNumber(row.factory_invoice_value),
    rdl_invoice_quantity: safeNumber(row.rdl_invoice_quantity),
    rdl_invoice_value: safeNumber(row.rdl_invoice_value),
});

const normalizeCiAndRealizationData = (row: CiAndRealizationData): CiAndRealizationData => ({
    ...row,
    rdl_invoice_quantity: safeNumber(row.rdl_invoice_quantity),
    rdl_invoice_value: safeNumber(row.rdl_invoice_value),
    realized_amount: safeNumber(row.realized_amount),
});

const normalizeFactoryInvoiceData = (row: FactoryInvoiceData): FactoryInvoiceData => ({
    ...row,
    factory_invoice_quantity: safeNumber(row.factory_invoice_quantity),
    factory_invoice_value: safeNumber(row.factory_invoice_value),
    factory_payment: safeNumber(row.factory_payment),
});

export const activityReportRouter = createTRPCRouter({
    getCommercialActivityReport: protectedProcedure
        .input(
            z.object({
                fromDate: z.string(),
                toDate: z.string(),
                buyerIds: z.array(z.number()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMERCIAL_ACTIVITY_REPORT]?.can_view;
            
            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view commercial activity report.",
                });
            }
            
            try {
                const isBuyersSelected = input.buyerIds && input.buyerIds.length > 0;

                const buyerSelectClause = isBuyersSelected 
                    ? Prisma.sql`AND B.id IN (${Prisma.join(input.buyerIds!)})`
                    : Prisma.empty;

                let po_wise_data: PoWiseData[];
                let ci_and_realization_data: CiAndRealizationData[];
                let factoryInvoiceData: FactoryInvoiceData[];

                await Promise.all([
                    po_wise_data = await ctx.db.$queryRaw<PoWiseData[]>`
                        SELECT
                            B.buyer_name AS buyer_name,
                            F.name AS factory_name,
                            SD.buyer_po,
                            STRING_AGG(DISTINCT E.exfactory_no, ', ') AS exfactory_nos,
                            STRING_AGG(DISTINCT TO_CHAR(E.EXFACTORY_DATE, 'DD Mon YYYY'), ', ') AS exfactory_dates,
                            SUM(ES.delivery_quantity) AS shipment_quantity,
                            COALESCE(FI_AGG.invoice_no, '-') AS factory_invoice,
                            COALESCE(FI_AGG.invoice_date, '-') AS factory_invoice_date,
                            CASE
                                WHEN FI_AGG.invoice_no IS NULL 
                                    THEN '-'
                                ELSE SUM(ES.delivery_quantity)::TEXT
                            END AS factory_invoice_quantity,
                            CASE
                                WHEN FI_AGG.invoice_no IS NULL 
                                    THEN '-'
                                WHEN COALESCE(FSD.transfer_rate, 0) > 0
                                    THEN (SUM(ES.delivery_quantity) * FSD.transfer_rate)::NUMERIC(18,2)::TEXT
                                ELSE (SUM(ES.delivery_quantity) * FSD.factory_rate)::NUMERIC(18,2)::TEXT
                            END AS factory_invoice_value,
                            COALESCE(LC.lc_no, '-') AS lc_no,
                            COALESCE(SC.sales_contract_no, '-') AS sales_contract_no,
                            COALESCE(RI_AGG.invoice_no, '-') AS rdl_invoice,
                            COALESCE(RI_AGG.invoice_date, '-') AS rdl_invoice_date,
                            COALESCE(RI_AGG.invoice_quantity::TEXT, '-') AS rdl_invoice_quantity,
                            COALESCE((RI_AGG.invoice_quantity * SD.fob_rate)::NUMERIC(18,2)::TEXT, '-') AS rdl_invoice_value,
                            COALESCE(DS_AGG.fdbc_no, '-') AS fdbc_no,
                            COALESCE(DS_AGG.fdbc_date, '-') AS fdbc_date
                        FROM buyer_orders BO
                        INNER JOIN order_styles OS ON OS.order_id = BO.id
                        INNER JOIN shipment_details SD ON SD.order_style_id = OS.id
                        INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN buyers B ON B.id = BO.buyer_id
                        INNER JOIN factories F ON F.id = BO.factory_id
                        LEFT JOIN lc_shipments LCS ON LCS.shipment_details_id = SD.id
                        LEFT JOIN lc_orders LCO ON LCO.id = LCS.lc_order_id
                        LEFT JOIN lc_master LC ON LC.id = LCO.lc_master_id
                        LEFT JOIN sales_contract_details SCD ON SCD.order_id = BO.id
                        LEFT JOIN sales_contracts SC ON SC.id = SCD.sales_contract_id
                        INNER JOIN exfactory_shipments ES ON ES.shipment_details_id = SD.id
                        INNER JOIN exfactory_orders EO ON EO.id = ES.exfactory_orders_id
                        INNER JOIN exfactory E ON E.id = EO.exfactory_id
                        LEFT JOIN (
                            SELECT
                                FID.exfactory_shipment_id,
                                STRING_AGG(DISTINCT FI.invoice_no, ', ') AS invoice_no,
                                STRING_AGG(DISTINCT TO_CHAR(FI.invoice_date, 'DD Mon YYYY'), ', ') AS invoice_date
                            FROM factory_invoice_details FID
                                INNER JOIN factory_invoice FI ON FI.id = FID.factory_invoice_id
                            GROUP BY FID.exfactory_shipment_id
                        ) FI_AGG ON FI_AGG.exfactory_shipment_id = ES.id
                        LEFT JOIN (
                            SELECT
                                FID.exfactory_shipment_id,
                                STRING_AGG(DISTINCT RI.invoice_no, ', ') AS invoice_no,
                                STRING_AGG(DISTINCT TO_CHAR(RI.invoice_date, 'DD Mon YYYY'), ', ') AS invoice_date,
                                SUM(RISD.invoice_quantity) AS invoice_quantity
                            FROM rdl_invoice_shipment_details RISD
                                INNER JOIN rdl_invoice_details RID ON RID.id = RISD.rdl_invoice_details_id
                                INNER JOIN rdl_invoice RI ON RI.id = RID.rdl_invoice_id
                                INNER JOIN factory_invoice_details AS FID ON FID.id = RISD.factory_invoice_details_id
                            GROUP BY FID.exfactory_shipment_id
                        ) RI_AGG ON RI_AGG.exfactory_shipment_id = ES.id
                        LEFT JOIN (
                            SELECT
                                RISD.shipment_details_id,
                                STRING_AGG(DISTINCT DS.fdbc_no, ', ') AS fdbc_no,
                                STRING_AGG(DISTINCT TO_CHAR(DS.fdbc_date, 'DD Mon YYYY'), ', ') AS fdbc_date
                            FROM rdl_invoice_shipment_details RISD
                                INNER JOIN rdl_invoice_details RID  ON RID.id = RISD.rdl_invoice_details_id
                                INNER JOIN document_submissions_details DSD ON DSD.rdl_invoice_id = RID.rdl_invoice_id
                                INNER JOIN document_submissions DS ON DS.id = DSD.document_submissions_id
                            GROUP BY RISD.shipment_details_id
                        ) DS_AGG ON DS_AGG.shipment_details_id = SD.id
                        WHERE E.exfactory_date BETWEEN ${input.fromDate} AND ${input.toDate}
                            AND COALESCE(ES.delivery_quantity, 0) > 0
                            ${buyerSelectClause}
                        GROUP BY
                            E.ID,
                            SD.id,
                            FSD.id,
                            BO.id,
                            OS.id,
                            B.id,
                            F.id,
                            LC.id,
                            SC.id,
                            FI_AGG.invoice_no,
                            FI_AGG.invoice_date,
                            RI_AGG.invoice_no,
                            RI_AGG.invoice_date,
                            RI_AGG.invoice_quantity,
                            DS_AGG.fdbc_no,
                            DS_AGG.fdbc_date
                        ORDER BY 
                            E.exfactory_date ASC, 
                            B.buyer_name ASC;
                    `,
                    
                    ci_and_realization_data = await ctx.db.$queryRaw<CiAndRealizationData[]>`
                        SELECT
                            B.buyer_name,
                            RI.invoice_no AS rdl_invoice,
                            TO_CHAR(RI.invoice_date, 'DD Mon YYYY') AS rdl_invoice_date,
                            STRING_AGG(DISTINCT E.exfactory_no, ', ') AS exfactory_nos,
                            STRING_AGG(DISTINCT TO_CHAR(E.exfactory_date, 'DD Mon YYYY'), ', ') AS exfactory_dates,
                            SUM(RISD.invoice_quantity) AS rdl_invoice_quantity,
                            SUM(RISD.invoice_quantity * SD.fob_rate / BO.currency_rate)::NUMERIC(18, 2) AS rdl_invoice_value,
                            COALESCE(DS.FDBC_NO, '-') AS FDBC_NO,
                            COALESCE(DS.SUBMISSION_DATE::TEXT, '-') AS DOCUMENT_SUBMISSION_DATE,
                            COALESCE(CI.REF_NO, '-') AS CI_NO,
                            COALESCE(TO_CHAR(CI.INVOICE_DATE, 'DD mon YYYY'), '-') AS CI_DATE,
                            COALESCE(PRD.realized_amount::TEXT, '-') AS REALIZED_AMOUNT,
                            COALESCE(TO_CHAR(PR.realization_date, 'DD mon YYYY'), '-') AS REALIZED_DATE
                        FROM rdl_invoice RI
                            INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN factory_invoice_details FID ON FID.id = RISD.factory_invoice_details_id
                            INNER JOIN exfactory_shipments ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN shipment_details SD ON SD.id = ES.shipment_details_id
                            INNER JOIN order_styles OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders BO ON BO.id = OS.order_id
                            INNER JOIN buyers B ON B.id = BO.buyer_id
                            INNER JOIN exfactory_orders EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory E ON E.id = EO.exfactory_id
                            LEFT JOIN document_submissions_details AS DSD ON DSD.rdl_invoice_id = RI.id
                            LEFT JOIN document_submissions AS DS ON DS.id = DSD.document_submissions_id
                            LEFT JOIN commission_invoice AS CI ON CI.document_submission_id = DS.id OR CI.rdl_invoice_id = RI.id
                            LEFT JOIN proceed_realization_details AS PRD ON PRD.rdl_invoice_id = RI.id
                            LEFT JOIN proceed_realization AS PR ON PR.id = PRD.realization_id
                        WHERE E.exfactory_date BETWEEN ${input.fromDate} AND ${input.toDate}
                            AND COALESCE(ES.delivery_quantity, 0) > 0
                            ${buyerSelectClause}
                        GROUP BY RI.id, RI.invoice_no, RI.invoice_date, B.id, DS.ID, CI.ID, PR.ID, PRD.ID;
                    `,

                    factoryInvoiceData = await ctx.db.$queryRaw<FactoryInvoiceData[]>`
                        SELECT
                            B.buyer_name,
                            STRING_AGG(DISTINCT TO_CHAR(E.exfactory_date, 'DD Mon YYYY'), ', ') AS exfactory_dates,
                            F.name AS factory_name,
                            COALESCE(STRING_AGG(DISTINCT LC.lc_no, ', '), '-') AS lc_no,
                            COALESCE(SC.sales_contract_no, '-') AS sales_contract_no,
                            FI.invoice_no AS factory_invoice,
                            TO_CHAR(FI.invoice_date, 'DD Mon YYYY') AS factory_invoice_date,
                            CASE
                                WHEN FI.invoice_no IS NULL 
                                    THEN '-'
                                ELSE SUM(ES.delivery_quantity)::TEXT
                            END AS factory_invoice_quantity,
                            CASE
                                WHEN FI.invoice_no IS NULL
                                    THEN '-'
                                ELSE SUM(
                                    ES.delivery_quantity *
                                    CASE
                                        WHEN COALESCE(FSD.transfer_rate, 0) > 0
                                            THEN FSD.transfer_rate
                                        ELSE FSD.factory_rate
                                    END
                                )::NUMERIC(18,2)::TEXT
                            END AS factory_invoice_value,
                            COALESCE(DS.FDBC_NO, '-') AS FDBC_NO,
                            COALESCE(FP.PAID_AMOUNT::TEXT, '-') AS FACTORY_PAYMENT,
                            COALESCE(FP.PAYMENT_DATE::TEXT, '-') AS FACTORY_PAYMENT_DATE
                        FROM factory_invoice AS FI
                            INNER JOIN factory_invoice_details FID ON FID.factory_invoice_id = FI.id
                            INNER JOIN exfactory_shipments ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN shipment_details SD ON SD.id = ES.shipment_details_id
                            INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN order_styles OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders BO ON BO.id = OS.order_id
                            INNER JOIN buyers B ON B.id = BO.buyer_id
                            INNER JOIN exfactory_orders EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory E ON E.id = EO.exfactory_id
                            INNER JOIN factories F ON F.id = BO.factory_id
                            LEFT JOIN lc_shipments LCS ON LCS.shipment_details_id = SD.id
                            LEFT JOIN lc_orders LCO ON LCO.id = LCS.lc_order_id
                            LEFT JOIN lc_master LC ON LC.id = LCO.lc_master_id
                            LEFT JOIN sales_contract_details SCD ON SCD.order_id = BO.id
                            LEFT JOIN sales_contracts SC ON SC.id = SCD.sales_contract_id
                            LEFT JOIN factory_payments AS FP ON FP.factory_invoice_id = FI.id
                            LEFT JOIN document_submissions AS DS ON DS.id = FP.document_submission_id
                        WHERE E.exfactory_date BETWEEN ${input.fromDate} AND ${input.toDate}
                            AND COALESCE(ES.delivery_quantity, 0) > 0
                            ${buyerSelectClause}
                        GROUP BY FI.id, B.id, F.id, SC.id, DS.ID, FP.ID;
                    `,
                ]);

                const normalizedPoWiseData = po_wise_data.map(normalizePoWiseData);
                const normalizedCiAndRealizationData = ci_and_realization_data.map(normalizeCiAndRealizationData);
                const normalizedFactoryInvoiceData = factoryInvoiceData.map(normalizeFactoryInvoiceData);

                const generatedBy = `${ctx.user.first_name ?? ""} ${ctx.user.last_name ?? ""}`.trim();

                const buffer = await generateActivityReportExcel({
                    poWiseData: normalizedPoWiseData,
                    ciAndRealizationData: normalizedCiAndRealizationData,
                    factoryInvoiceData: normalizedFactoryInvoiceData,
                    reportMeta: {
                        fromDate: input.fromDate,
                        toDate: input.toDate,
                        generatedBy: generatedBy || "Unknown User"
                    }
                });

                return Array.from(new Uint8Array(buffer));
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
})
