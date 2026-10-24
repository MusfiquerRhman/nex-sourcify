import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { generateCrossPaymentReportExcel } from "../../../_utils/excel/cross_payment_report_excel/generateCrossPaymentReportExcel";
import { safeNumber } from "~/utils/numbers";
import { Prisma } from "@prisma/client";
import type { CrossPayReport } from "./_types/crossPayReport";
import { formatDate } from "~/utils/localDateString";

const normalizeData = (row: CrossPayReport): CrossPayReport => ({
    ...row,
    cross_payment_date: formatDate(row.cross_payment_date),
    invoice_date: formatDate(row.invoice_date),
    factory_invoice_quantity: safeNumber(row.factory_invoice_quantity),
    factory_invoice_value: safeNumber(row.factory_invoice_value),
    factory_payable_value: safeNumber(row.factory_payable_value),
    factory_payment_date: formatDate(row.factory_payment_date),
    realization_date: row.realization_date ? formatDate(row.realization_date) : '-',
    rdl_invoice_date: row.rdl_invoice_date ? formatDate(row.rdl_invoice_date): '-',
    rdl_invoice_quantity: safeNumber(row.rdl_invoice_quantity),
    rdl_invoice_value: safeNumber(row.rdl_invoice_value),
    regularization_date: row.regularization_date ? formatDate(row.regularization_date) : '-',
});

export const crossPaymentReportRouter = createTRPCRouter({
    getExcel: protectedProcedure
        .input(z.object({
            buyer_ids: z.array(z.number()).optional(),
            factory_ids: z.array(z.string()).optional(),
            cross_pay_from: z.string().optional(),
            cross_pay_to: z.string().optional(),
            factory_pay_from: z.string().optional(),
            factory_pay_to: z.string().optional()
        }))
        .mutation(async ({ctx, input}) => {
            if (!ctx.permissions[m.CROSS_PAYMENT_REPORT]?.can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view commission distribution reports.",
                });
            }

            const filters: Prisma.Sql[] = [];

            if (input.cross_pay_from && input.cross_pay_to) {
                filters.push(
                    Prisma.sql`CP.cross_payment_date BETWEEN ${input.cross_pay_from}::date AND ${input.cross_pay_to}::date`,
                );
            }

            if (input.factory_pay_from && input.factory_pay_to) {
                filters.push(
                    Prisma.sql`CPD.FACTORY_PAYMENT_DATE BETWEEN ${input.factory_pay_from}::date AND ${input.factory_pay_to}::date`,
                );
            }

            if(input.buyer_ids && input.buyer_ids?.length > 0) {
                filters.push(
                    Prisma.sql`B.ID IN (${Prisma.join(input.buyer_ids)})`,
                );
            }

            if(input.factory_ids && input.factory_ids?.length > 0) {
                filters.push(
                    Prisma.sql`F.ID IN (${Prisma.join(input.factory_ids)})`,
                );
            }

            const whereClause = filters.length > 0
                ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
                : Prisma.empty;

            try {
                const results = await ctx.db.$queryRaw<CrossPayReport[]>`
                    WITH TT_PROCEED AS (
                        SELECT 
                            FP.factory_invoice_id,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            SUM(RISD.INVOICE_QUANTITY) AS QUANTITY,
                            SUM(RISD.INVOICE_QUANTITY * SD.FOB_RATE) AS VALUE,
                            FP.ADDED_AT AS REGULARIZATION_DATE    
                        FROM factory_payments AS FP
                        LEFT JOIN rdl_invoice AS RI ON RI.id = FP.rdl_invoice_id
                        LEFT JOIN proceed_realization_details AS PRD ON PRD.rdl_invoice_id = RI.id
                        LEFT JOIN proceed_realization AS PR ON PR.id = PRD.realization_id
                        LEFT JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                        LEFT JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FP.factory_invoice_id
                        LEFT JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        LEFT JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY FP.ID, DS.ID, PR.ID, RI.ID
                    ),
                    LC_PROCEED AS (
                        SELECT 
                            FP.factory_invoice_id,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            SUM(RISD.INVOICE_QUANTITY) AS QUANTITY,
                            SUM(RISD.INVOICE_QUANTITY * SD.FOB_RATE) AS VALUE,
                            FP.ADDED_AT AS REGULARIZATION_DATE    
                        FROM factory_payments AS FP
                        LEFT JOIN document_submissions AS DS ON DS.id = FP.document_submission_id
                        LEFT JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                        LEFT JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                        LEFT JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FP.factory_invoice_id
                        LEFT JOIN rdl_invoice AS RI ON RI.id = RID.rdl_invoice_id
                        LEFT JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        LEFT JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY FP.ID, DS.ID, PR.ID, RI.ID
                    )
                    SELECT 
                        CP.cross_payment_ref,
                        CP.cross_payment_date,
                        B.buyer_name,
                        STRING_AGG(DISTINCT concat(T.name, ' ', PT.tenor, ' ', PT.term_description), ', ') AS PAYMENT_TERM,
                        F.NAME AS FACTORY_NAME,
                        FI.INVOICE_NO,
                        FI.INVOICE_DATE,
                        SUM(ES.delivery_quantity) AS FACTORY_INVOICE_QUANTITY,
                        SUM(
                            CASE 
                                WHEN FSD.TRANSFER_RATE <> 0
                                    THEN ES.delivery_quantity * FSD.TRANSFER_RATE
                                ELSE ES.delivery_quantity * FSD.FACTORY_RATE
                            END
                        ) AS FACTORY_INVOICE_VALUE,
                        CPD.VALUE AS FACTORY_PAYABLE_VALUE,
                        CPD.FACTORY_PAYMENT_NO,
                        CPD.FACTORY_PAYMENT_DATE,
                        CASE WHEN T.NAME = 'TT'
                            THEN COALESCE(TTP.FDBC_NO, '-')
                            ELSE COALESCE(LCP.FDBC_NO, '-')
                        END AS FDBC_NO,
                        CASE WHEN T.NAME = 'TT'
                            THEN TTP.REALIZATION_DATE
                            ELSE LCP.REALIZATION_DATE
                        END AS REALIZATION_DATE,
                        CASE WHEN T.NAME = 'TT'
                            THEN COALESCE(TTP.INVOICE_NO, '-')
                            ELSE COALESCE(LCP.INVOICE_NO, '-')
                        END AS RDL_INVOICE_NO,
                        CASE WHEN T.NAME = 'TT'
                            THEN TTP.INVOICE_DATE
                            ELSE LCP.INVOICE_DATE
                        END AS RDL_INVOICE_DATE,
                        CASE WHEN T.NAME = 'TT'
                            THEN COALESCE(TTP.QUANTITY::NUMERIC(18, 2)::TEXT, '-')
                            ELSE COALESCE(LCP.QUANTITY::NUMERIC(18, 2)::TEXT, '-')
                        END AS RDL_INVOICE_QUANTITY,
                        CASE WHEN T.NAME = 'TT'
                            THEN COALESCE(TTP.VALUE::NUMERIC(18, 2)::TEXT, '-')
                            ELSE COALESCE(LCP.VALUE::NUMERIC(18, 2)::TEXT, '-')
                        END AS RDL_INVOICE_VALUE,
                        CASE WHEN T.NAME = 'TT'
                            THEN TTP.REGULARIZATION_DATE
                            ELSE LCP.REGULARIZATION_DATE
                        END AS REGULARIZATION_DATE
                    FROM cross_payments AS CP
                        INNER JOIN cross_payment_details AS CPD ON CPD.cross_payment_id = CP.id
                        INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                        INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                        INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                        INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN payment_terms AS PT ON PT.id = SD.payment_term_id
                        INNER JOIN terms AS T ON T.id = PT.term_id
                        INNER JOIN buyers AS B ON B.id = FI.buyer_id
                        INNER JOIN factories AS F ON F.id = FI.factory_id
                        LEFT JOIN TT_PROCEED AS TTP ON TTP.factory_invoice_id = FI.id AND T.NAME = 'TT'
                        LEFT JOIN LC_PROCEED AS LCP ON LCP.factory_invoice_id = FI.id AND T.NAME = 'LC'
                    ${whereClause}
                    GROUP BY CP.ID, 
                        B.ID, 
                        CPD.ID, 
                        F.NAME, 
                        FI.ID, 
                        T.ID, 
                        TTP.FDBC_NO, 
                        TTP.INVOICE_NO,
                        TTP.REALIZATION_DATE,
                        TTP.INVOICE_DATE,
                        TTP.QUANTITY,
                        TTP.VALUE,
                        TTP.REGULARIZATION_DATE,
                        LCP.FDBC_NO,
                        LCP.REALIZATION_DATE,
                        LCP.INVOICE_NO,
                        LCP.INVOICE_DATE,
                        LCP.QUANTITY,
                        LCP.VALUE,
                        LCP.REGULARIZATION_DATE;
                `;

                const normalizedData = results.map(normalizeData);

                const buffer = await generateCrossPaymentReportExcel({
                    rows: normalizedData,
                    cross_pay_from: input.cross_pay_from,
                    cross_pay_to: input.cross_pay_to,
                    factory_pay_from: input.factory_pay_from,
                    factory_pay_to: input.factory_pay_to,
                    generatedBy: `${ctx.user.first_name ?? ""} ${ctx.user.last_name ?? ""}`.trim(),
                });

                return Array.from(new Uint8Array(buffer));
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })

})