import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, FACTORY_PAYMENT, LC_ID, TT_ID } from "~/utils/config";
import { currencyFormatter } from "~/utils/localNumberStrings";
import type { FactoryPaymentResult, FactoryPaymentDetailsById, FactoryPaymentDetails, GetCrossPaymentByIdTypes} from './_types/factoryPayments'

export const factoryPaymentRouter = createTRPCRouter({
    getFactoryPayments: protectedProcedure
        .input(z.object({
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view factory payments.",
                });
            }
            
            try {
                const results = await ctx.db.$queryRaw<FactoryPaymentResult[]>`
                    WITH TT_PROCEED AS (
                        SELECT
                            PRD.rdl_invoice_id,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT
                        FROM proceed_realization_details AS PRD
                        GROUP BY PRD.rdl_invoice_id
                    ),
                    LC_PROCEED AS (
                        SELECT
                            PRD.realization_id AS PRD_ID,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT
                        FROM proceed_realization_details AS PRD
                        GROUP BY PRD.realization_id
                    ),
                    TT_DETAILS AS (
                        SELECT
                            PRD.realization_id,
                            RI.ID AS RID,
                            RI.invoice_no
                        FROM proceed_realization_details AS PRD
                            INNER JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
                    ),
                    LC_DETAILS AS (
                        SELECT
                            DS.id,
                            DS.FDBC_NO
                        FROM document_submissions AS DS     
                    ),
                    LC_INVOICE AS (
                        SELECT 
                            DSD.document_submissions_id,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM document_submissions_details AS DSD 
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY DSD.document_submissions_id
                    ),
                    TT_INVOICE AS (
                        SELECT 
                            RI.id,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY RI.id
                    ),
                    LC_PAYMENT AS (
                        SELECT
                            FP.document_submission_id,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COUNT(FP.ID) AS PAID_COUNT
                        FROM factory_payments AS FP
                        WHERE FP.paid_amount > 0
                        GROUP BY FP.document_submission_id
                    ),
                    TT_PAYMENT AS (
                        SELECT  
                            RID.rdl_invoice_id,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COUNT(FP.ID) AS PAID_COUNT
                        FROM rdl_invoice_details AS RID
                            INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FI.id
                        WHERE FP.paid_amount > 0
                        GROUP BY RID.rdl_invoice_id
                    ),
                    LC_INVOICE_COUNT AS (
                        SELECT
                            DSD.document_submissions_id,
                            COUNT(DISTINCT DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD 
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                        GROUP BY DSD.document_submissions_id
                    ),
                    TT_INVOICE_COUNT AS (
                        SELECT  
                            RID.rdl_invoice_id,
                            COUNT(DISTINCT FI.ID) AS TOTAL_INVOICE_COUNT
                        FROM rdl_invoice_details AS RID
                            INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                        GROUP BY RID.rdl_invoice_id
                    ),
                    TT_CROSS_PAY_CHECK AS (
                        SELECT
                            COUNT(*) > 0 AS CROSS_PAY_EXISTS,
                            RID.rdl_invoice_id
                        FROM cross_payment_details AS CPD
                            INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                        GROUP BY RID.rdl_invoice_id
                    ),
                    LC_CROSS_PAY_CHECK AS (
                        SELECT
                            COUNT(*) > 0 AS CROSS_PAY_EXISTS,
                            DSD.document_submissions_id
                        FROM cross_payment_details AS CPD
                            INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                            INNER JOIN document_submissions_details AS DSD ON DSD.rdl_invoice_id = RID.rdl_invoice_id
                        GROUP BY DSD.document_submissions_id
                    ),
                    FACTORY_PAYMENTS_LIST AS (
                        SELECT  
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN CONCAT('tt.', TTD.RID)
                                WHEN PR.term_id = ${LC_ID} THEN CONCAT('lc.', LCD.id)
                            END AS ID,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTD.invoice_no
                                WHEN PR.term_id = ${LC_ID} THEN LCD.FDBC_NO
                            END AS FDBC_NO,
                            PR.REALIZATION_DATE,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTI.TOTAL_INVOICE_VALUE
                                WHEN PR.term_id = ${LC_ID} THEN LCI.TOTAL_INVOICE_VALUE
                            END AS RDL_INVOICE_VALUE,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTP.REALIZED_AMOUNT
                                WHEN PR.term_id = ${LC_ID} THEN LCP.REALIZED_AMOUNT
                            END AS REALIZED_AMOUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_PAY.FACTORY_PAID_AMOUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_PAY.FACTORY_PAID_AMOUNT, 0)
                            END AS FACTORY_PAID_AMOUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_PAY.PAID_COUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_PAY.PAID_COUNT, 0)
                            END AS PAID_COUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_COUNT.TOTAL_INVOICE_COUNT, 0) - COALESCE(TT_PAY.PAID_COUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_COUNT.TOTAL_INVOICE_COUNT, 0) - COALESCE(LC_PAY.PAID_COUNT, 0)
                            END AS PENDING_COUNT,
                            CASE
                                WHEN PR.term_id = 1 THEN COALESCE(TT_CPC.CROSS_PAY_EXISTS, FALSE)
                                WHEN PR.term_id = 2 THEN COALESCE(LC_CPC.CROSS_PAY_EXISTS, FALSE)
                            END AS HAS_CROSS_PAYMENT
                        FROM proceed_realization AS PR
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            LEFT JOIN TT_DETAILS AS TTD ON PR.term_id = ${TT_ID} AND TTD.realization_id = PR.id 
                            LEFT JOIN LC_DETAILS AS LCD ON PR.term_id = ${LC_ID} AND LCD.id = PR.document_submission_id 
                            LEFT JOIN TT_PROCEED AS TTP ON PR.term_id = ${TT_ID} AND TTP.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_PROCEED AS LCP ON PR.term_id = ${LC_ID} AND LCP.PRD_ID = PR.ID
                            LEFT JOIN TT_INVOICE AS TTI ON PR.term_id = ${TT_ID} AND TTI.id = TTD.RID
                            LEFT JOIN LC_INVOICE AS LCI ON PR.term_id = ${LC_ID} AND LCI.document_submissions_id = LCD.id
                            LEFT JOIN TT_PAYMENT AS TT_PAY ON PR.term_id = ${TT_ID} AND TT_PAY.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_PAYMENT AS LC_PAY ON PR.term_id = ${LC_ID} AND LC_PAY.document_submission_id = LCD.id
                            LEFT JOIN TT_INVOICE_COUNT AS TT_COUNT ON PR.term_id = ${TT_ID} AND TT_COUNT.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_INVOICE_COUNT AS LC_COUNT ON PR.term_id = ${LC_ID} AND LC_COUNT.document_submissions_id = LCD.id
                            LEFT JOIN TT_CROSS_PAY_CHECK AS TT_CPC ON PR.term_id = 1 AND TT_CPC.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_CROSS_PAY_CHECK AS LC_CPC ON PR.term_id = 2 AND LC_CPC.document_submissions_id = LCD.id
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
                                WHERE T.BUYER_ID = PR.buyer_id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY 
                            TTD.RID, 
                            LCD.id, 
                            PR.term_id, 
                            T.NAME, 
                            ttd.invoice_no, 
                            lcd.fdbc_no, 
                            pr.realization_date, 
                            tti.total_invoice_value, 
                            lci.total_invoice_value,
                            tt_pay.factory_paid_amount,
                            lc_pay.factory_paid_amount,
                            tt_pay.paid_count,
                            lc_pay.paid_count,
                            tt_count.total_invoice_count,
                            lc_count.total_invoice_count,
                            lcp.realized_amount,
                            ttp.realized_amount,
                            TT_CPC.CROSS_PAY_EXISTS,
                            LC_CPC.CROSS_PAY_EXISTS
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FACTORY_PAYMENTS_LIST AS PFL
                    ORDER BY REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total: number = results.length > 0 ? Number(results[0]?.total_count) : 0;
                const factoryPayments = results.map(({total_count: _, ...payments}) => ({
                    id: payments.id,
                    term_name: payments.term_name,
                    fdbc_no: payments.fdbc_no,
                    realization_date: payments.realization_date,
                    factory_paid_amount: currencyFormatter(Number(payments.factory_paid_amount), '$'),
                    rdl_invoice_value: currencyFormatter(Number(payments.rdl_invoice_value), '$'),
                    realized_amount: currencyFormatter(Number(payments.realized_amount), '$'),
                    has_cross_payment: payments.has_cross_payment,
                    paid_count: payments.paid_count,
                    pending_count: payments.pending_count,
                }));

                return { factoryPayments, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchFactoryPayments: protectedProcedure
        .input(z.object({
            query: z.string(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view factory payments.",
                });
            }
            
            try {
                const results = await ctx.db.$queryRaw<FactoryPaymentResult[]>`
                    WITH TT_PROCEED AS (
                        SELECT
                            PRD.rdl_invoice_id,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18, 2) AS REALIZED_AMOUNT
                        FROM proceed_realization_details AS PRD
                        GROUP BY PRD.rdl_invoice_id
                    ),
                    LC_PROCEED AS (
                        SELECT
                            PRD.realization_id AS PRD_ID,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18, 2) AS REALIZED_AMOUNT
                        FROM proceed_realization_details AS PRD
                        GROUP BY PRD.realization_id
                    ),
                    TT_DETAILS AS (
                        SELECT
                            PRD.realization_id,
                            RI.ID AS RID,
                            RI.invoice_no
                        FROM proceed_realization_details AS PRD
                        INNER JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
                    ),
                    LC_DETAILS AS (
                        SELECT
                            DS.id,
                            DS.FDBC_NO
                        FROM document_submissions AS DS
                    ),
                    LC_INVOICE AS (
                        SELECT
                            DSD.document_submissions_id,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM document_submissions_details AS DSD
                        INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY DSD.document_submissions_id
                    ),
                    TT_INVOICE AS (
                        SELECT
                            RI.id,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM rdl_invoice AS RI
                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY RI.id
                    ),
                    LC_PAYMENT AS (
                        SELECT
                            FP.document_submission_id,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COUNT(FP.ID) AS PAID_COUNT
                        FROM factory_payments AS FP
                        WHERE FP.paid_amount > 0
                        GROUP BY FP.document_submission_id
                    ),
                    TT_PAYMENT AS (
                        SELECT
                            RID.rdl_invoice_id,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COUNT(FP.ID) AS PAID_COUNT
                        FROM rdl_invoice_details AS RID
                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                        INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FI.id
                        WHERE FP.paid_amount > 0
                        GROUP BY RID.rdl_invoice_id
                    ),
                    LC_INVOICE_COUNT AS (
                        SELECT
                            DSD.document_submissions_id,
                            COUNT(DISTINCT DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD
                        INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                        GROUP BY DSD.document_submissions_id
                    ),
                    TT_INVOICE_COUNT AS (
                        SELECT
                            RID.rdl_invoice_id,
                            COUNT(DISTINCT FI.ID) AS TOTAL_INVOICE_COUNT
                        FROM rdl_invoice_details AS RID
                        INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                        GROUP BY RID.rdl_invoice_id
                    ),
                    TT_CROSS_PAY_CHECK AS (
                        SELECT
                            COUNT(*) > 0 AS CROSS_PAY_EXISTS,
                            RID.rdl_invoice_id
                        FROM cross_payment_details AS CPD
                        INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                        INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                        GROUP BY RID.rdl_invoice_id
                    ),
                    LC_CROSS_PAY_CHECK AS (
                        SELECT
                            COUNT(*) > 0 AS CROSS_PAY_EXISTS,
                            DSD.document_submissions_id
                        FROM cross_payment_details AS CPD
                        INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                        INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                        INNER JOIN document_submissions_details AS DSD ON DSD.rdl_invoice_id = RID.rdl_invoice_id
                        GROUP BY DSD.document_submissions_id
                    ),
                    FACTORY_PAYMENTS_BASE AS (
                        SELECT
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN CONCAT('tt.', TTD.RID)
                                WHEN PR.term_id = ${LC_ID} THEN CONCAT('lc.', LCD.id)
                            END AS ID,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTD.invoice_no
                                WHEN PR.term_id = ${LC_ID} THEN LCD.FDBC_NO
                            END AS FDBC_NO,
                            PR.REALIZATION_DATE,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTI.TOTAL_INVOICE_VALUE
                                WHEN PR.term_id = ${LC_ID} THEN LCI.TOTAL_INVOICE_VALUE
                            END AS RDL_INVOICE_VALUE,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN TTP.REALIZED_AMOUNT
                                WHEN PR.term_id = ${LC_ID} THEN LCP.REALIZED_AMOUNT
                            END AS REALIZED_AMOUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_PAY.FACTORY_PAID_AMOUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_PAY.FACTORY_PAID_AMOUNT, 0)
                            END AS FACTORY_PAID_AMOUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_PAY.PAID_COUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_PAY.PAID_COUNT, 0)
                            END AS PAID_COUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_COUNT.TOTAL_INVOICE_COUNT, 0) - COALESCE(TT_PAY.PAID_COUNT, 0)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_COUNT.TOTAL_INVOICE_COUNT, 0) - COALESCE(LC_PAY.PAID_COUNT, 0)
                            END AS PENDING_COUNT,
                            CASE
                                WHEN PR.term_id = ${TT_ID} THEN COALESCE(TT_CPC.CROSS_PAY_EXISTS, FALSE)
                                WHEN PR.term_id = ${LC_ID} THEN COALESCE(LC_CPC.CROSS_PAY_EXISTS, FALSE)
                            END AS HAS_CROSS_PAYMENT,
                            PR.TERM_ID,
                            PR.DOCUMENT_SUBMISSION_ID,
                            TTD.RID AS RDL_INVOICE_ID,
                            TTD.INVOICE_NO,
                            LCD.FDBC_NO AS LC_FDBC_NO,
                            B.BUYER_NAME
                        FROM proceed_realization AS PR
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            LEFT JOIN TT_DETAILS AS TTD ON PR.term_id = ${TT_ID} AND TTD.realization_id = PR.id
                            LEFT JOIN LC_DETAILS AS LCD ON PR.term_id = ${LC_ID} AND LCD.id = PR.document_submission_id
                            LEFT JOIN TT_PROCEED AS TTP ON PR.term_id = ${TT_ID} AND TTP.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_PROCEED AS LCP ON PR.term_id = ${LC_ID} AND LCP.PRD_ID = PR.ID
                            LEFT JOIN TT_INVOICE AS TTI ON PR.term_id = ${TT_ID} AND TTI.id = TTD.RID
                            LEFT JOIN LC_INVOICE AS LCI ON PR.term_id = ${LC_ID} AND LCI.document_submissions_id = LCD.id
                            LEFT JOIN TT_PAYMENT AS TT_PAY ON PR.term_id = ${TT_ID} AND TT_PAY.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_PAYMENT AS LC_PAY ON PR.term_id = ${LC_ID} AND LC_PAY.document_submission_id = LCD.id
                            LEFT JOIN TT_INVOICE_COUNT AS TT_COUNT ON PR.term_id = ${TT_ID} AND TT_COUNT.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_INVOICE_COUNT AS LC_COUNT ON PR.term_id = ${LC_ID} AND LC_COUNT.document_submissions_id = LCD.id
                            LEFT JOIN TT_CROSS_PAY_CHECK AS TT_CPC ON PR.term_id = ${TT_ID} AND TT_CPC.rdl_invoice_id = TTD.RID
                            LEFT JOIN LC_CROSS_PAY_CHECK AS LC_CPC ON PR.term_id = ${LC_ID} AND LC_CPC.document_submissions_id = LCD.id
                            INNER JOIN buyers AS B ON B.id = PR.buyer_id
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
                                INNER JOIN TEAMS AS TEAM ON TEAM.ID = TM.TEAM_ID
                                WHERE TEAM.BUYER_ID = PR.buyer_id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            TTD.invoice_no ILIKE '%' || ${input.query} || '%'
                            OR LCD.FDBC_NO ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM document_submissions_details AS DSD2
                                INNER JOIN document_submission_factory_invoices AS DSFI
                                    ON DSFI.document_submissions_details_id = DSD2.id
                                INNER JOIN factory_invoice AS FI
                                    ON FI.id = DSFI.factory_invoice_id
                                WHERE DSD2.document_submissions_id = PR.document_submission_id
                                    AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                                    AND PR.term_id = ${LC_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM rdl_invoice_details AS RID
                                INNER JOIN factory_invoice AS FI
                                    ON FI.id = RID.factory_invoice_id
                                WHERE RID.rdl_invoice_id = TTD.RID
                                    AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                                    AND PR.term_id = ${TT_ID}
                            )
                        )
                    ),
                    FACTORY_PAYMENTS_LIST AS (
                        SELECT
                            FPB.ID,
                            FPB.TERM_NAME,
                            FPB.FDBC_NO,
                            FPB.REALIZATION_DATE,
                            FPB.RDL_INVOICE_VALUE,
                            FPB.REALIZED_AMOUNT,
                            FPB.FACTORY_PAID_AMOUNT,
                            FPB.PAID_COUNT,
                            FPB.PENDING_COUNT,
                            FPB.HAS_CROSS_PAYMENT,
                            CASE
                                WHEN FPB.TERM_ID = ${TT_ID}
                                    AND FPB.INVOICE_NO = ${input.query}
                                    THEN 0

                                WHEN FPB.TERM_ID = ${LC_ID}
                                    AND FPB.LC_FDBC_NO = ${input.query}
                                    THEN 0

                                WHEN FPB.TERM_ID = ${TT_ID}
                                    AND FPB.INVOICE_NO ILIKE ${input.query} || '%'
                                    THEN 1

                                WHEN FPB.TERM_ID = ${LC_ID}
                                    AND FPB.LC_FDBC_NO ILIKE ${input.query} || '%'
                                    THEN 1

                                WHEN FPB.TERM_ID = ${TT_ID}
                                    AND FPB.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                                    THEN 2

                                WHEN FPB.TERM_ID = ${LC_ID}
                                    AND FPB.LC_FDBC_NO ILIKE '%' || ${input.query} || '%'
                                    THEN 2

                                WHEN FPB.TERM_ID = ${TT_ID}
                                    AND EXISTS (
                                        SELECT 1
                                        FROM rdl_invoice_details AS RID
                                        INNER JOIN factory_invoice AS FI
                                            ON FI.id = RID.factory_invoice_id
                                        WHERE RID.rdl_invoice_id = FPB.RDL_INVOICE_ID
                                            AND FI.invoice_no = ${input.query}
                                    )
                                    THEN 3

                                WHEN FPB.TERM_ID = ${LC_ID}
                                    AND EXISTS (
                                        SELECT 1
                                        FROM document_submissions_details AS DSD2
                                        INNER JOIN document_submission_factory_invoices AS DSFI
                                            ON DSFI.document_submissions_details_id = DSD2.id
                                        INNER JOIN factory_invoice AS FI
                                            ON FI.id = DSFI.factory_invoice_id
                                        WHERE DSD2.document_submissions_id = FPB.DOCUMENT_SUBMISSION_ID
                                            AND FI.invoice_no = ${input.query}
                                    )
                                    THEN 3

                                WHEN FPB.TERM_ID = ${TT_ID}
                                    AND EXISTS (
                                        SELECT 1
                                        FROM rdl_invoice_details AS RID
                                        INNER JOIN factory_invoice AS FI
                                            ON FI.id = RID.factory_invoice_id
                                        WHERE RID.rdl_invoice_id = FPB.RDL_INVOICE_ID
                                            AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                                    )
                                    THEN 4

                                WHEN FPB.TERM_ID = ${LC_ID}
                                    AND EXISTS (
                                        SELECT 1
                                        FROM document_submissions_details AS DSD2
                                        INNER JOIN document_submission_factory_invoices AS DSFI
                                            ON DSFI.document_submissions_details_id = DSD2.id
                                        INNER JOIN factory_invoice AS FI
                                            ON FI.id = DSFI.factory_invoice_id
                                        WHERE DSD2.document_submissions_id = FPB.DOCUMENT_SUBMISSION_ID
                                            AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                                    )
                                    THEN 4

                                WHEN FPB.TERM_NAME ILIKE '%' || ${input.query} || '%'
                                    THEN 5

                                WHEN FPB.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                                    THEN 6

                                ELSE 7
                            END AS SEARCH_RANK

                        FROM FACTORY_PAYMENTS_BASE AS FPB
                    )
                    SELECT DISTINCT
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FACTORY_PAYMENTS_LIST AS PFL
                    ORDER BY
                        SEARCH_RANK ASC,
                        REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total: number = results.length > 0 ? Number(results[0]?.total_count) : 0;
                const factoryPayments = results.map(({total_count: _, ...payments}) => ({
                    id: payments.id,
                    term_name: payments.term_name,
                    fdbc_no: payments.fdbc_no,
                    realization_date: payments.realization_date,
                    factory_paid_amount: currencyFormatter(Number(payments.factory_paid_amount), '$'),
                    rdl_invoice_value: currencyFormatter(Number(payments.rdl_invoice_value), '$'),
                    realized_amount: currencyFormatter(Number(payments.realized_amount), '$'),
                    paid_count: payments.paid_count,
                    pending_count: payments.pending_count,
                    has_cross_payment: payments.has_cross_payment,
                }));

                return { factoryPayments, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFactoryPaymentById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view factory payments.",
                });
            }

            const [term, id] = input.id.split('.');

            try {
                let result: FactoryPaymentDetailsById[];
                let factoryPayments: FactoryPaymentDetails[];

                if(term === 'lc') {
                    await Promise.all([
                        result = await ctx.db.$queryRaw<FactoryPaymentDetailsById[]>`
                            WITH RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS (
                                SELECT 
                                    DSD.DOCUMENT_SUBMISSIONS_ID AS DSDID,
                                    SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                                FROM document_submissions_details AS DSD 
                                    INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                                    INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                                    INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                                GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                            ),
                            TOTAL_REALIZATION AS (
                                SELECT
                                    PRD.realization_id AS PRD_ID,
                                    SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT
                                FROM proceed_realization_details AS PRD
                                GROUP BY PRD.realization_id
                            )
                            SELECT DISTINCT
                                T.NAME AS TERM_NAME,
                                DS.FDBC_NO,
                                PR.REALIZATION_DATE,
                                RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                                TR.REALIZED_AMOUNT,
                                COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                                FPH.REMARKS
                            FROM document_submissions AS DS
                                INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                                INNER JOIN terms AS T ON T.id = DS.term_id
                                INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
                                LEFT JOIN proceed_realization AS PR ON DS.id = PR.document_submission_id
                                LEFT JOIN TOTAL_REALIZATION AS TR ON TR.PRD_ID = PR.ID
                                LEFT JOIN factory_payments AS FP ON FP.document_submission_id = DS.id
                                LEFT JOIN factory_payment_header AS FPH ON FPH.document_submission_id = DS.id
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
                                    WHERE T.BUYER_ID = B.ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            )
                            AND DS.ID = ${id}
                            GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FPH.ID, TR.REALIZED_AMOUNT;
                        `,

                        factoryPayments = await ctx.db.$queryRaw<FactoryPaymentDetails[]>`
                            WITH FOB_RATE AS (
                                SELECT
                                    RISD.rdl_invoice_details_id AS RIDI,
                                    RISD.invoice_quantity AS QUANTITY,
                                    CASE 
                                        WHEN FSD.TRANSFER_RATE <> 0
                                            THEN RISD.invoice_quantity * FSD.TRANSFER_RATE
                                        ELSE RISD.invoice_quantity * FSD.FACTORY_RATE
                                    END AS VALUE
                                FROM rdl_invoice_shipment_details AS RISD
                                INNER JOIN factory_invoice_details AS FID ON FID.id = RISD.factory_invoice_details_id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = RISD.shipment_details_id
                            )
                            SELECT 
                                FP.ID AS DB_ID,
                                F.NAME AS FACTORY_NAME,
                                FI.ID AS FACTORY_INVOICE_ID,
                                FI.INVOICE_NO AS FACTORY_INVOICE_NO,
                                DS.FDBC_NO,
                                FI.INVOICE_DATE AS FACTORY_INVOICE_DATE,
                                SUM(FR.QUANTITY)::NUMERIC(18, 2) AS INVOICE_QUANTITY,
                                SUM(FR.VALUE)::NUMERIC(18, 2) AS INVOICE_VALUE,
                                COALESCE(FP.PAID_AMOUNT, 0)::NUMERIC(18, 2) AS PAID_AMOUNT,
                                FP.PAYMENT_DATE AS PAYMENT_DATE,
                                COALESCE(FP.is_cross_paid, FALSE) AS is_cross_paid,
                                FP.factory_payment_no
                            FROM document_submissions AS DS 
                                INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                                INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = DSD.rdl_invoice_id
                                INNER JOIN FOB_RATE AS FR ON FR.RIDI = RID.id
                                INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                INNER JOIN factories AS F ON F.id = FI.factory_id
                                LEFT JOIN factory_payments AS FP ON FP.document_submission_id = DS.id AND FP.factory_invoice_id = FI.id
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
                                    WHERE T.BUYER_ID = DS.BUYER_ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            )
                            AND DS.ID = ${id}
                            GROUP BY FI.ID, FP.ID, F.ID, DS.ID;
                        `,
                    ])
                }
                else {
                    await Promise.all([
                        result = await ctx.db.$queryRaw<FactoryPaymentDetailsById[]>`
                            WITH INVOICE_VALUE AS (
                                SELECT 
                                    RI.id,
                                    SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                                FROM rdl_invoice AS RI
                                    INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                                    INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                                GROUP BY RI.id
                            ),
                            TOTAL_REALIZATION AS (
                                SELECT
                                    PRD.rdl_invoice_id,
                                    SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT,
                                    MIN(PR.REALIZATION_DATE) AS REALIZATION_DATE
                                FROM proceed_realization_details AS PRD
                                    INNER JOIN proceed_realization AS PR ON PR.id = PRD.realization_id
                                GROUP BY PRD.rdl_invoice_id
                            )
                            SELECT DISTINCT
                                T.NAME AS TERM_NAME,
                                RI.INVOICE_NO AS FDBC_NO,
                                TR.REALIZATION_DATE,
                                IV.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                                TR.REALIZED_AMOUNT,
                                COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                                FPH.REMARKS
                            FROM rdl_invoice AS RI
                                INNER JOIN INVOICE_VALUE AS IV ON RI.id = IV.id
                                INNER JOIN terms AS T ON T.id = RI.term_id
                                INNER JOIN BUYERS AS B ON B.id = RI.buyer_id
                                LEFT JOIN TOTAL_REALIZATION AS TR ON TR.rdl_invoice_id = RI.ID
                                LEFT JOIN factory_payments AS FP ON FP.rdl_invoice_id = RI.id
                                LEFT JOIN factory_payment_header AS FPH ON FPH.rdl_invoice_id = RI.id
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
                                    WHERE T.BUYER_ID = B.ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            )
                            AND RI.ID = ${id}
                            GROUP BY RI.ID, IV.TOTAL_INVOICE_VALUE, T.ID, FPH.ID, TR.REALIZATION_DATE, TR.REALIZED_AMOUNT;
                        `,

                        factoryPayments = await ctx.db.$queryRaw<FactoryPaymentDetails[]>`
                            WITH FOB_RATE AS (
                                SELECT
                                    RISD.rdl_invoice_details_id AS RIDI,
                                    RISD.invoice_quantity AS QUANTITY,
                                    CASE 
                                        WHEN FSD.TRANSFER_RATE <> 0
                                            THEN RISD.invoice_quantity * FSD.TRANSFER_RATE
                                        ELSE RISD.invoice_quantity * FSD.FACTORY_RATE
                                    END AS VALUE
                                FROM rdl_invoice_shipment_details AS RISD
                                INNER JOIN factory_invoice_details AS FID ON FID.id = RISD.factory_invoice_details_id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = RISD.shipment_details_id
                            )
                            SELECT 
                                FP.ID AS DB_ID,
                                F.NAME AS FACTORY_NAME,
                                FI.ID AS FACTORY_INVOICE_ID,
                                FI.INVOICE_NO AS FACTORY_INVOICE_NO,
                                RI.INVOICE_NO AS FDBC_NO,
                                FI.INVOICE_DATE AS FACTORY_INVOICE_DATE,
                                SUM(FR.QUANTITY)::NUMERIC(18, 2) AS INVOICE_QUANTITY,
                                SUM(FR.VALUE)::NUMERIC(18, 2) AS INVOICE_VALUE,
                                COALESCE(FP.PAID_AMOUNT, 0)::NUMERIC(18, 2) AS PAID_AMOUNT,
                                FP.PAYMENT_DATE AS PAYMENT_DATE,
                                COALESCE(FP.is_cross_paid, FALSE) AS is_cross_paid,
                                FP.factory_payment_no
                            FROM rdl_invoice AS RI
                                INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                                INNER JOIN FOB_RATE AS FR ON FR.RIDI = RID.id
                                INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                                INNER JOIN factories AS F ON F.id = FI.factory_id
                                LEFT JOIN factory_payments AS FP ON FP.rdl_invoice_id = RI.id AND FP.factory_invoice_id = FI.id
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
                                    WHERE T.BUYER_ID = RI.BUYER_ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            )
                            AND RI.ID = ${id}
                            GROUP BY FI.ID, FP.ID, F.ID, RI.ID;
                        `,
                    ])
                }

                const factoryPaymentHeader = result[0];

                return {factoryPaymentHeader, factoryPayments};

            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateFactoryPayment: protectedProcedure
        .input(z.object({
            db_id: z.string(),
            factoryInvoices: z.array(z.object({
                db_id: z.string().optional(),
                factory_invoice_id: z.string(),
                paid_amount: z.number().optional(),
                payment_date: z.date().optional(),
                factory_payment_no: z.string().optional(),
                is_cross_paid: z.boolean().optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.REGULAR_PAYMENT]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update factory payments.",
                });
            }

            const [term, id] = input.db_id.split('.');
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    for (const factoryInvoice of input.factoryInvoices ?? []) {
                        if (factoryInvoice.db_id) {
                            await tx.factory_payments.update({
                                where: {
                                    id: factoryInvoice.db_id,
                                },
                                data: {
                                    paid_amount: factoryInvoice.paid_amount,
                                    payment_date: factoryInvoice.payment_date,
                                    is_cross_paid: factoryInvoice.is_cross_paid,
                                    factory_payment_no: factoryInvoice.factory_payment_no,
                                },
                            });
                        } else {
                            await tx.factory_payments.create({
                                data: {
                                    document_submission_id: term === 'lc' ? id : null,
                                    rdl_invoice_id: term === 'tt' ? id : null,
                                    factory_invoice_id: factoryInvoice.factory_invoice_id,
                                    paid_amount: factoryInvoice.paid_amount,
                                    payment_date: factoryInvoice.payment_date,
                                    is_cross_paid: factoryInvoice.is_cross_paid,
                                    factory_payment_no: factoryInvoice.factory_payment_no,
                                },
                            });
                        }
                        
                        await tx.$executeRaw`
                            UPDATE commercial_tna_planning_details AS CTPD
                                SET actual_date = FP.payment_date
                            FROM commercial_tna_planning AS CTP,
                                factory_invoice AS FI,
                                commercial_tna_templates_actions AS CTTA,
                                tna_actions AS TA,
                                factory_payments AS FP
                            WHERE CTP.id = CTPD.commercial_tna_planning_id
                                AND FI.id = CTP.factory_invoice_id
                                AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                                AND TA.id = CTTA.tna_action_id
                                AND FP.factory_invoice_id = FI.id
                                AND TA.id = ${FACTORY_PAYMENT}
                                AND FP.id = ${factoryInvoice.db_id};
                        `;
                    }
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkCrossPaymentForDocumentSubmission: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to check cross payment for document submission.",
                });
            }

            const [term, id] = input.id.split('.');
            
            try {
                let crossPaymentDetails: GetCrossPaymentByIdTypes[];

                if(term === 'lc'){
                    crossPaymentDetails = await ctx.db.$queryRaw<GetCrossPaymentByIdTypes[]>`
                        SELECT 
                            CPD.id AS factory_payment_detail_id,
                            FI.ID AS factory_invoice_id,
                            FI.invoice_no AS factory_invoice_no,
                            F.name AS factory_name,
                            CPD.factory_payment_no,
                            CPD.factory_payment_date,
                            CPD.value AS paid_amount,
                            CPD.regularized AS regularized
                        FROM document_submissions AS DS
                            INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                            INNER JOIN factory_invoice AS FI ON FI.id = DSFI.factory_invoice_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN cross_payment_details AS CPD ON CPD.factory_invoice_id = FI.id
                        WHERE DS.ID = ${id};
                    `;
                }
                else {
                    crossPaymentDetails = await ctx.db.$queryRaw<GetCrossPaymentByIdTypes[]>`
                        SELECT 
                            CPD.id AS factory_payment_detail_id,
                            FI.ID AS factory_invoice_id,
                            FI.invoice_no AS factory_invoice_no,
                            F.name AS factory_name,
                            CPD.factory_payment_no,
                            CPD.factory_payment_date,
                            CPD.value AS paid_amount,
                            CPD.regularized AS regularized
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN cross_payment_details AS CPD ON CPD.factory_invoice_id = FI.id
                        WHERE RI.ID = ${id};
                    `;
                }

                return { details: crossPaymentDetails };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    regularizeCrossPayment: protectedProcedure
        .input(z.object({
            id: z.string(),
            cross_payment_details_id: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.REGULAR_PAYMENT]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to regularize cross payment.",
                });
            }

            const [term, id] = input.id.split('.');
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    const crossPaymentDetail = await tx.cross_payment_details.findUnique({
                        where: {
                            id: input.cross_payment_details_id,
                        },
                    });

                    if (!crossPaymentDetail) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Cross payment detail not found.",
                        });
                    }

                    const newPayment = await tx.factory_payments.create({
                        data: {
                            document_submission_id: term === 'lc' ? id : null,
                            rdl_invoice_id: term === 'tt' ? id : null,
                            factory_invoice_id: crossPaymentDetail.factory_invoice_id,
                            paid_amount: crossPaymentDetail.value,
                            payment_date: crossPaymentDetail.factory_payment_date,
                            factory_payment_no: crossPaymentDetail.factory_payment_no,
                        },
                    });

                    await Promise.all([
                        await tx.cross_payment_details.update({
                            where: {
                                id: input.cross_payment_details_id,
                            },
                            data: {
                                regularized: true,
                            },
                        }),

                        await tx.$executeRaw`
                            UPDATE commercial_tna_planning_details AS CTPD
                                SET actual_date = FP.payment_date
                            FROM commercial_tna_planning AS CTP,
                                factory_invoice AS FI,
                                commercial_tna_templates_actions AS CTTA,
                                tna_actions AS TA,
                                factory_payments AS FP
                            WHERE CTP.id = CTPD.commercial_tna_planning_id
                                AND FI.id = CTP.factory_invoice_id
                                AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                                AND TA.id = CTTA.tna_action_id
                                AND FP.factory_invoice_id = FI.id
                                AND TA.id = ${FACTORY_PAYMENT}
                                AND FP.id = ${newPayment.id};
                        `
                    ])
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
})
