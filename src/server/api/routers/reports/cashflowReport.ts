import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { generateCashflowReportExcel } from "~/server/_utils/excel/cashflow_report_excel/generateCashflowReportExcel";
import { m } from "~/utils/moduleMap";
import { safeNumber } from "~/utils/numbers";
import type { CashflowReport } from "./_types/cashflowReport";

const normalizeData = (row: CashflowReport): CashflowReport => ({
    ...row,
    total_ci: row.total_ci == null ? null : safeNumber(row.total_ci),
    term_days: row.term_days == null ? null : safeNumber(row.term_days),
    buffer_days: safeNumber(row.buffer_days),
    days_overdue: row.days_overdue == null ? null : safeNumber(row.days_overdue),
});

export const cashflowReportRouter = createTRPCRouter({
    getExcel: protectedProcedure
        .input(z.object({
            buyer_ids: z.array(z.number().int().positive()).optional(),
            from_date: z.string().date("Enter a valid From Date").or(z.literal("")).optional(),
            to_date: z.string().date("Enter a valid To Date").or(z.literal("")).optional(),
        }).refine((values) => !values.from_date || !values.to_date || values.from_date <= values.to_date, {
            path: ["to_date"],
            message: "To Date must be on or after From Date",
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.CASHFLOW_REPORT]?.can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view cashflow reports.",
                });
            }

            const buyerFilter = input.buyer_ids?.length
                ? Prisma.sql`AND B.id IN (${Prisma.join(input.buyer_ids)})`
                : Prisma.empty;

            try {
                const results = await ctx.db.$queryRaw<CashflowReport[]>`
                    WITH INV AS (
                        SELECT
                            RISD.rdl_invoice_details_id AS RIDID,
                            ES.shipment_details_id AS SDID,
                            SUM(RISD.invoice_quantity) AS INVOICE_QUANTITY
                        FROM rdl_invoice_shipment_details RISD
                            INNER JOIN factory_invoice_details FID ON FID.id = RISD.factory_invoice_details_id
                            INNER JOIN exfactory_shipments ES ON ES.id = FID.exfactory_shipment_id
                        GROUP BY RISD.rdl_invoice_details_id, ES.shipment_details_id
                    ),
                    SHIPMENT_CALC AS (
                        SELECT
                            SD.id AS shipment_detail_id,
                            SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1) AS FOB_RATE,
                            FSD.FACTORY_RATE,
                            FSD.TRANSFER_RATE,
                            (SD.FOB_RATE / COALESCE(BO.CURRENCY_RATE, 1))
                                * (1 - COALESCE(ESD.EARLY_SETTLEMENT_CHARGE, 0) / 100) AS EFFECTIVE_FOB,
                            PT.tenor AS TERM_DAYS
                        FROM shipment_details SD
                            INNER JOIN order_styles OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders BO ON BO.id = OS.order_id
                            INNER JOIN factory_orders FO ON FO.order_id = BO.id
                            INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN commission_distributions_details CDD ON CDD.shipment_details_id = SD.id
                            LEFT JOIN early_settlement_details ESD ON ESD.shipment_details_id = SD.id
                            INNER JOIN payment_terms PT ON PT.id = SD.payment_term_id
                    ),
                    CI_FOR_LC AS (
                        SELECT
                            DS.id AS DS_ID,
                            CASE
                                WHEN COALESCE(AVG(SC.TRANSFER_RATE), 0) <> 0
                                    THEN SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB) - SUM(INV.INVOICE_QUANTITY * SC.TRANSFER_RATE)
                                ELSE SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB) - SUM(INV.INVOICE_QUANTITY * SC.FACTORY_RATE)
                            END AS TOTAL_CI,
                            SC.TERM_DAYS
                        FROM document_submissions DS
                            INNER JOIN document_submissions_details DSD ON DSD.document_submissions_id = DS.id
                            INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                            INNER JOIN INV ON INV.RIDID = RID.id
                            INNER JOIN SHIPMENT_CALC SC ON SC.shipment_detail_id = INV.SDID
                        GROUP BY DS.id, SC.TERM_DAYS
                    ),
                    CI_FOR_TT AS (
                        SELECT
                            RI.id AS RI_ID,
                            CASE
                                WHEN COALESCE(AVG(SC.TRANSFER_RATE), 0) <> 0
                                    THEN SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB) - SUM(INV.INVOICE_QUANTITY * SC.TRANSFER_RATE)
                                ELSE SUM(INV.INVOICE_QUANTITY * SC.EFFECTIVE_FOB) - SUM(INV.INVOICE_QUANTITY * SC.FACTORY_RATE)
                            END AS TOTAL_CI,
                            SC.TERM_DAYS
                        FROM rdl_invoice RI
                            INNER JOIN rdl_invoice_details RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN INV ON INV.RIDID = RID.id
                            INNER JOIN SHIPMENT_CALC SC ON SC.shipment_detail_id = INV.SDID
                        GROUP BY RI.id, SC.TERM_DAYS
                    ),
                    REMIT_CALC AS (
                        SELECT
                            COALESCE(B.short_name, B.buyer_name) AS BUYER_NAME,
                            CI.ref_no AS CI_NO,
                            CI.INVOICE_DATE,
                            (CASE 
                                WHEN T.name = 'TT' 
                                    THEN CFT.TOTAL_CI 
                                ELSE CFL.TOTAL_CI 
                            END)::NUMERIC(18, 2) AS TOTAL_CI,
                            CI.INVOICE_DATE + INTERVAL '15 days' AS CALC_SHIPMENT_DATE,
                            (CASE 
                                WHEN T.name = 'TT' 
                                    THEN CFT.TERM_DAYS 
                                ELSE CFL.TERM_DAYS 
                            END)::NUMERIC(18, 2) AS TERM_DAYS
                        FROM commission_invoice CI
                            INNER JOIN terms T ON T.id = CI.term_id
                            LEFT JOIN CI_FOR_LC CFL ON CFL.DS_ID = CI.document_submission_id AND T.name = 'LC'
                            LEFT JOIN CI_FOR_TT CFT ON CFT.RI_ID = CI.rdl_invoice_id AND T.name = 'TT'
                            INNER JOIN buyers B ON B.id = CI.buyer_id
                        WHERE (
                            (
                                T.name = 'LC'
                                AND NOT EXISTS (
                                    SELECT 1 FROM proceed_realization PR
                                    WHERE PR.document_submission_id = CI.document_submission_id
                                )
                            ) OR (
                                T.name = 'TT'
                                AND NOT EXISTS (
                                    SELECT 1 FROM proceed_realization_details PRD
                                    WHERE PRD.rdl_invoice_id = CI.rdl_invoice_id
                                )
                            )
                        )
                        ${buyerFilter}
                        ${input.from_date ? Prisma.sql`AND CI.INVOICE_DATE >= ${input.from_date}::date` : Prisma.empty}
                        ${input.to_date ? Prisma.sql`AND CI.INVOICE_DATE < (${input.to_date}::date + INTERVAL '1 day')` : Prisma.empty}
                        GROUP BY CI.id, CFT.TOTAL_CI, CFL.TOTAL_CI, T.name, B.id, CFT.TERM_DAYS, CFL.TERM_DAYS
                    ),
                    REMIT_DATES AS (
                        SELECT
                            *, (INVOICE_DATE + (30 + TERM_DAYS) * INTERVAL '1 day')::DATE AS CALC_REMIT_DATE
                        FROM REMIT_CALC
                    ),
                    AGING_CALC AS (
                        SELECT *, CURRENT_DATE - CALC_REMIT_DATE AS DAYS_OVERDUE
                        FROM REMIT_DATES
                    )
                    SELECT
                        BUYER_NAME,
                        CI_NO,
                        INVOICE_DATE,
                        TOTAL_CI,
                        CALC_SHIPMENT_DATE,
                        TERM_DAYS,
                        15 AS BUFFER_DAYS,
                        CALC_REMIT_DATE,
                        COALESCE(TO_CHAR(CALC_REMIT_DATE + INTERVAL '1 day', 'IY"_WK"IW'), 'Unscheduled') AS REMIT_WEEK,
                        COALESCE(TO_CHAR(CALC_REMIT_DATE, 'YY_MM_Mon'), 'Unscheduled') AS REMIT_MONTH,
                        DAYS_OVERDUE,
                        CASE
                            WHEN DAYS_OVERDUE <= 0 THEN 'Not Overdue'
                            WHEN DAYS_OVERDUE <= 30 THEN 'Less than 30 Days'
                            WHEN DAYS_OVERDUE <= 60 THEN 'Over 30 Days'
                            WHEN DAYS_OVERDUE <= 90 THEN 'Over 60 Days'
                            WHEN DAYS_OVERDUE <= 120 THEN 'Over 90 Days'
                            ELSE 'Over 120 Days'
                        END AS AGING_SLAB
                    FROM AGING_CALC
                    WHERE TOTAL_CI IS NOT NULL AND CALC_REMIT_DATE IS NOT NULL
                    ORDER BY BUYER_NAME, INVOICE_DATE, CI_NO, TERM_DAYS;
                `;

                const buffer = await generateCashflowReportExcel({
                    rows: results.map(normalizeData),
                    fromDate: input.from_date,
                    toDate: input.to_date,
                    generatedBy: `${ctx.user.first_name ?? ""} ${ctx.user.last_name ?? ""}`.trim(),
                });

                return Array.from(new Uint8Array(buffer));
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});
