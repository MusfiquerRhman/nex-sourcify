import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, FACTORY_PAYMENT } from "~/utils/config";
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
                    FACTORY_INVOICE_COUNT AS (
                        SELECT
                            DSD.DOCUMENT_SUBMISSIONS_ID,
                            COUNT(DISTINCT DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD 
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    TOTAL_REALIZATION AS (
						SELECT
							PRD.realization_id AS PRD_ID,
							SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT
						FROM proceed_realization_details AS PRD
						GROUP BY PRD.realization_id
					),
                    PENDING_FACTORY_PAYMENT AS (
                        SELECT 
                            DS.id AS ID,
                            T.NAME AS TERM_NAME,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                            TR.REALIZED_AMOUNT,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COALESCE(COUNT(FP.ID), 0) AS PAID_COUNT,
                            COALESCE(FIC.TOTAL_INVOICE_COUNT, 0) - COALESCE(COUNT(FP.ID), 0) AS PENDING_COUNT
                        FROM proceed_realization AS PR 
                            INNER JOIN TOTAL_REALIZATION AS TR ON TR.PRD_ID = PR.ID
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            INNER JOIN FACTORY_INVOICE_COUNT AS FIC ON FIC.DOCUMENT_SUBMISSIONS_ID = DS.id
                            LEFT JOIN factory_payments AS FP ON FP.document_submission_id = DS.id
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
                                WHERE T.BUYER_ID = DS.buyer_id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FIC.TOTAL_INVOICE_COUNT, TR.REALIZED_AMOUNT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PENDING_FACTORY_PAYMENT AS PFP
                    ORDER BY PFP.REALIZATION_DATE DESC
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
                    FACTORY_INVOICE_COUNT AS (
                        SELECT
                            DSD.DOCUMENT_SUBMISSIONS_ID,
                            COUNT(DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD 
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                            INNER JOIN factory_invoice AS FI ON FI.id = DSFI.factory_invoice_id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    TOTAL_REALIZATION AS (
						SELECT
							PRD.realization_id AS PRD_ID,
							SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT
						FROM proceed_realization_details AS PRD
						GROUP BY PRD.realization_id
					),
                    PENDING_FACTORY_PAYMENT AS (
                        SELECT 
                            DS.id AS ID,
                            T.NAME AS TERM_NAME,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                            TR.REALIZED_AMOUNT,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COALESCE(COUNT(FP.ID), 0) AS PAID_COUNT,
                            COALESCE(FIC.TOTAL_INVOICE_COUNT, 0) - COALESCE(COUNT(FP.ID), 0) AS PENDING_COUNT
                        FROM proceed_realization AS PR 
                            INNER JOIN TOTAL_REALIZATION AS TR ON TR.PRD_ID = PR.ID
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            INNER JOIN FACTORY_INVOICE_COUNT AS FIC ON FIC.DOCUMENT_SUBMISSIONS_ID = DS.id
                            INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
                            LEFT JOIN factory_payments AS FP ON FP.document_submission_id = DS.id
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
                        AND (
                            DS.FDBC_NO ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM document_submissions_details DSD2
                                INNER JOIN document_submission_factory_invoices DSFI ON DSFI.document_submissions_details_id = DSD2.id
                                INNER JOIN factory_invoice FI ON FI.id = DSFI.factory_invoice_id
                                WHERE DSD2.document_submissions_id = DS.id
                                    AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                            )
                        )
                        GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FIC.TOTAL_INVOICE_COUNT, TR.REALIZED_AMOUNT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PENDING_FACTORY_PAYMENT AS PFP
                    ORDER BY PFP.REALIZATION_DATE DESC
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
            
            try {
                let result: FactoryPaymentDetailsById[];
                let factoryPayments: FactoryPaymentDetails[];

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
                        AND DS.ID = ${input.id}
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
                        WHERE DS.ID = ${input.id}
                        GROUP BY FI.ID, FP.ID, F.ID, DS.ID;
                    `,
                ])

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
            
            try {
                await ctx.db.$transaction(async (tx) => {
                    for (const factoryInvoice of input.factoryInvoices ?? []) {
                        if (factoryInvoice.db_id) {
                            await tx.factory_payments.upsert({
                                where: {
                                    id: factoryInvoice.db_id,
                                },
                                update: {
                                    paid_amount: factoryInvoice.paid_amount ?? null,
                                    payment_date: factoryInvoice.payment_date ?? null,
                                    is_cross_paid: factoryInvoice.is_cross_paid ?? null,
                                    factory_payment_no: factoryInvoice.factory_payment_no ?? null,
                                },
                                create: {
                                    id: factoryInvoice.db_id,
                                    document_submission_id: input.db_id,
                                    factory_invoice_id: factoryInvoice.factory_invoice_id,
                                    paid_amount: factoryInvoice.paid_amount ?? null,
                                    payment_date: factoryInvoice.payment_date ?? null,
                                    is_cross_paid: factoryInvoice.is_cross_paid ?? null,
                                    factory_payment_no: factoryInvoice.factory_payment_no ?? null,
                                },
                            });

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
                        } else {
                            await tx.factory_payments.create({
                                data: {
                                    document_submission_id: input.db_id,
                                    factory_invoice_id: factoryInvoice.factory_invoice_id,
                                    paid_amount: factoryInvoice.paid_amount ?? null,
                                    payment_date: factoryInvoice.payment_date ?? null,
                                    is_cross_paid: factoryInvoice.is_cross_paid ?? null,
                                    factory_payment_no: factoryInvoice.factory_payment_no ?? null,
                                },
                            });
                        }
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
            document_submission_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to check cross payment for document submission.",
                });
            }
            
            try {
                const crossPaymentDetails = await ctx.db.$queryRaw<GetCrossPaymentByIdTypes[]>`
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
                    WHERE DS.ID = ${input.document_submission_id};
                `;

                return { details: crossPaymentDetails };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    regularizeCrossPayment: protectedProcedure
        .input(z.object({
            document_submission_id: z.string(),
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
                            document_submission_id: input.document_submission_id,
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
