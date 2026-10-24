import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, type factory_payments } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, PROCEED_DATE } from "~/utils/config";
import { currencyFormatter } from "~/utils/localNumberStrings";
import type { ProceedRealizationResult, RdlInvoiceDetailsResult } from './_types/proceedRealization'

export const proceedRealizationRouter = createTRPCRouter({
    getProceedRealization: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view proceed realization.",
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<ProceedRealizationResult[]>`
                    WITH PROCEED AS (
                        SELECT
                            PR.id,
                            B.buyer_name,
                            DS.fdbc_no,
                            T.NAME AS TERM_NAME,
                            PR.REALIZATION_DATE,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT,
                            PR.ADDED_AT
                        FROM proceed_realization AS PR
                            LEFT JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                            LEFT JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN buyers AS B ON B.id = PR.buyer_id
                            INNER JOIN terms AS T ON T.id = PR.term_id
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
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY PR.ID, B.ID, T.ID, DS.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PROCEED
                    ORDER BY ADDED_AT DESC, REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const proceedRealizations = result.map(({ total_count: _, ...invoice}) => ({
                    ...invoice,
                    realized_amount: currencyFormatter(Number(invoice.realized_amount), '$'),
                }));

                return { proceedRealizations, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchProceedRealization: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view proceed realization.",
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<ProceedRealizationResult[]>`
                    WITH PROCEED AS (
                        SELECT DISTINCT
                            PR.id,
                            B.buyer_name,
                            DS.fdbc_no,
                            T.NAME AS TERM_NAME,
                            PR.REALIZATION_DATE,
                            SUM(PRD.REALIZED_AMOUNT)::NUMERIC(18,2) AS REALIZED_AMOUNT,
                            PR.ADDED_AT
                        FROM proceed_realization AS PR
                            LEFT JOIN PROCEED_REALIZATION_DETAILS AS PRD ON PRD.realization_id = PR.id
                            LEFT JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN buyers AS B ON B.id = PR.buyer_id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            LEFT JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
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
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            B.buyer_name ILIKE '%' || ${input.query} || '%'
                            OR DS.fdbc_no ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR RI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY PR.ID, B.ID, T.ID, DS.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PROCEED
                    ORDER BY ADDED_AT DESC, REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const proceedRealizations = result.map(({ total_count: _, ...invoice}) => ({
                    ...invoice,
                    realized_amount: currencyFormatter(Number(invoice.realized_amount), '$'),
                }));

                return { proceedRealizations, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteProceedRealization: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.PROCEED_REALIZATION]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete proceed realization.",
                });
            }
            
            try {
                // Order of action is very very important
                await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const realization = await tx.proceed_realization.findUnique({
                        where: {
                            id: input.id
                        }
                    });

                    let factoryPayments: factory_payments[];

                    // Get payment info before deleting the proceed details, otherwise broken relation return empty rows.
                    if(realization?.term_id === 2) { // LC
                        factoryPayments = await tx.factory_payments.findMany({
                            where: {
                                document_submission_id: realization.document_submission_id,
                            }
                        });
                    }
                    else { // TT
                        factoryPayments = await tx.$queryRaw<factory_payments[]>`
                            SELECT DISTINCT 
                                fp.* 
                            FROM factory_payments as fp
                                INNER JOIN proceed_realization_details AS prd ON prd.rdl_invoice_id = fp.rdl_invoice_id
                                INNER JOIN proceed_realization AS pr ON pr.id = prd.realization_id
                            WHERE pr.id = ${input.id}
                        `;
                    }

                    const deletedDetails = await tx.proceed_realization_details.findMany({
                        where: {
                            realization_id: input.id,
                        },
                    });

                    await Promise.all([
                        await tx.proceed_realization_details_history.createMany({
                            data: deletedDetails.map((detail) => ({
                                realization_details_id: detail.id,
                                realization_id: detail.realization_id,
                                rdl_invoice_id: detail.rdl_invoice_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        }),
                        
                        await tx.proceed_realization_details.deleteMany({
                            where: {
                                realization_id: input.id,
                            },
                        }),
                    ])

                    const deletedRealization = await tx.proceed_realization.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    const rdlInvoiceIds = [
                        ...new Set(
                            factoryPayments.map((payment) => payment.rdl_invoice_id)
                                .filter((id): id is string => id !== null)
                        ),
                    ];

                    if(deletedRealization.term_id === 2) { // LC
                        await tx.factory_payments.deleteMany({
                            where: {
                                document_submission_id: deletedRealization.document_submission_id,
                            }
                        })

                        await tx.factory_payment_header.deleteMany({
                            where: {
                                document_submission_id: deletedRealization.document_submission_id,
                            }
                        })
                    }
                    else { // TT
                        await tx.factory_payments.deleteMany({
                            where: {
                                rdl_invoice_id: {
                                    in: rdlInvoiceIds,
                                },
                            },
                        })

                        await tx.factory_payment_header.deleteMany({
                            where: {
                                rdl_invoice_id: {
                                    in: rdlInvoiceIds
                                }
                            }
                        })
                    }

                    await tx.proceed_realization_history.create({
                        data: {
                            proceed_realization_id: deletedRealization.id,
                            buyer_id: deletedRealization.buyer_id,
                            document_submission_id: deletedRealization.document_submission_id,
                            term_id: deletedRealization.term_id,
                            realization_date: deletedRealization.realization_date,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    await tx.factory_payments_history.createMany({
                        data: factoryPayments.map((payment) => ({
                            factory_payments_id: payment.id,
                            document_submission_id: payment.document_submission_id,
                            payment_date: payment.payment_date,
                            paid_amount: payment.paid_amount,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        })),
                    });

                }, {timeout: 30000}); 
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getDocumentSubmissionForProceedRealization: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view document submissions for proceed realization.",
                });
            }
            
            try {
                const documentSubmissions = await ctx.db.$queryRaw<{ id: string, fdbc_no: string; }[]>`
                    SELECT DISTINCT
                        ID, FDBC_NO
                    FROM document_submissions AS DS 
                    WHERE DS.ID NOT IN (
                        SELECT DOCUMENT_SUBMISSION_ID FROM proceed_realization
                    )
                    AND TERM_ID = ${input.term_id}
                    AND BUYER_ID = ${input.buyer_id};
                `;

                return documentSubmissions;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addProceedRealization: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            document_submission_id: z.string(),
            term_id: z.number(),
            realization_date: z.date(),
            bank_charge: z.number().optional(),
            document_charge: z.number().optional(),
            discount_charge: z.number().optional(),
            rdl_invoice_details: z.array(z.object({
                rdl_invoice_id: z.string(),
                proceed_value: z.number(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.PROCEED_REALIZATION]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add proceed realization.",
                });
            }
            
            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx, queueHistoryJob) => {
                    const newProceedRealization = await tx.proceed_realization.create({
                        data: {
                            buyer_id: input.buyer_id,
                            document_submission_id: input.document_submission_id,
                            term_id: input.term_id,
                            realization_date: input.realization_date,
                            bank_charge: input.bank_charge,
                            discount_charge: input.discount_charge,
                            document_charge: input.document_charge
                        },
                    });

                    await Promise.all([
                        await tx.proceed_realization_history.create({
                            data: {
                                proceed_realization_id: newProceedRealization.id,
                                buyer_id: newProceedRealization.buyer_id,
                                document_submission_id: newProceedRealization.document_submission_id,
                                term_id: newProceedRealization.term_id,
                                realization_date: newProceedRealization.realization_date,
                                discount_charge: newProceedRealization.discount_charge,
                                document_charge: newProceedRealization.document_charge,
                                bank_charge: newProceedRealization.bank_charge,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            },
                        }),

                        await tx.proceed_realization_details.createMany({
                            data: input.rdl_invoice_details.map((detail) => ({
                                realization_id: newProceedRealization.id,
                                rdl_invoice_id: detail.rdl_invoice_id,
                                realized_amount: detail.proceed_value,
                            })),
                        }),

                        queueHistoryJob({
                            name: "proceed_realization_details_added",
                            data: {
                                realization_id: newProceedRealization.id,
                                rdl_invoice_ids: input.rdl_invoice_details.map((detail) => detail.rdl_invoice_id),
                                action_by: ctx.user.id,
                            },
                        }),

                        await tx.$executeRaw`
                            UPDATE commercial_tna_planning_details AS CTPD
                                SET actual_date = PR.realization_date
                            FROM commercial_tna_planning AS CTP,
                                factory_invoice AS FI,
                                rdl_invoice_details AS RID,
                                commercial_tna_templates_actions AS CTTA,
                                tna_actions AS TA,
                                proceed_realization_details AS PRD,
                                proceed_realization AS PR
                            WHERE CTP.id = CTPD.commercial_tna_planning_id
                                AND FI.id = CTP.factory_invoice_id
                                AND CTTA.id = CTPD.commercial_tna_templates_actions_id
                                AND TA.id = CTTA.tna_action_id
                                AND RID.factory_invoice_id = FI.id
                                AND PRD.rdl_invoice_id = RID.rdl_invoice_id
                                AND PRD.realization_id = PR.id
                                AND TA.id = ${PROCEED_DATE}
                                AND PR.id = ${newProceedRealization.id};
                        `
                    ]);

                    return newProceedRealization.id;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getProceedRealizationById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view proceed realization.",
                });
            }
            
            try {
                const proceedRealizationObj = await ctx.db.proceed_realization.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        id: true,
                        buyer_id: true,
                        document_submissions: {
                            select: {
                                id: true,
                                fdbc_no: true,
                                sales_contracts: {
                                    select: {
                                        sales_contract_no: true,
                                    }
                                },
                                lc_master: {
                                    select: {
                                        lc_no: true,
                                    }
                                }
                            }
                        },
                        term_id: true,
                        realization_date: true,
                        bank_charge: true,
                        document_charge: true,
                        discount_charge: true,
                        proceed_realization_details: {
                            select: {
                                id: true,
                                rdl_invoice_id: true,
                                realized_amount: true,
                                rdl_invoice: {
                                    select: {
                                        invoice_no: true,
                                    },
                                },
                            }
                        }
                    }
                });

                if(!proceedRealizationObj) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Proceed Realization not found.",
                    });
                }

                const rdlInvoiceDetails = await ctx.db.$queryRaw<RdlInvoiceDetailsResult[]>`
                    SELECT
                        RI.id AS rdl_invoice_id,
                        RI.invoice_no AS rdl_invoice_no,
                        DSD.received_value AS invoice_value
                    FROM document_submissions AS DS
                        INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                        INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                    WHERE DS.id = ${proceedRealizationObj.document_submissions.id};
                `;

                const proceedRealization = proceedRealizationObj ? {
                    id: proceedRealizationObj.id,
                    buyer_id: proceedRealizationObj.buyer_id,
                    document_submission_id: proceedRealizationObj.document_submissions.id,
                    document_submission_no: proceedRealizationObj.document_submissions.fdbc_no,
                    lc_sc_no: proceedRealizationObj.document_submissions.sales_contracts?.sales_contract_no 
                        ?? proceedRealizationObj.document_submissions.lc_master?.lc_no ?? '',
                    term_id: proceedRealizationObj.term_id,
                    realization_date: proceedRealizationObj.realization_date,
                    bank_charge: proceedRealizationObj.bank_charge,
                    document_charge: proceedRealizationObj.document_charge,
                    discount_charge: proceedRealizationObj.discount_charge,
                    details: proceedRealizationObj.proceed_realization_details.map((detail) => ({
                        db_id: detail.id,
                        rdl_invoice_id: rdlInvoiceDetails.find(
                            (x) => x.rdl_invoice_id === detail.rdl_invoice_id
                        )?.rdl_invoice_id ?? '',
                        rdl_invoice_no: rdlInvoiceDetails.find(
                            (x) => x.rdl_invoice_id === detail.rdl_invoice_id
                        )?.rdl_invoice_no ?? '',
                        proceed_value: detail.realized_amount,
                        realized_amount: rdlInvoiceDetails.find(
                            (x) => x.rdl_invoice_id === detail.rdl_invoice_id
                        )?.invoice_value ?? 0,
                    })),
                } : null;

                return proceedRealization;  
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getRdlInvoiceDetailsForProceedRealization: protectedProcedure
        .input(z.object({
            document_submission_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view NexSourcify invoice details for proceed realization.",
                });
            }
            
            try {
                const rdlInvoiceDetails = await ctx.db.$queryRaw<RdlInvoiceDetailsResult[]>`
                    SELECT
                        RI.id AS rdl_invoice_id,
                        RI.invoice_no AS rdl_invoice_no,
                        DSD.received_value AS invoice_value
                    FROM document_submissions AS DS
                        INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                        INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                    WHERE DS.id = ${input.document_submission_id};
                `;

                return rdlInvoiceDetails;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateProceedRealization: protectedProcedure
        .input(z.object({
            id: z.string(),
            realization_date: z.date(),
            bank_charge: z.number().optional(),
            document_charge: z.number().optional(),
            discount_charge: z.number().optional(),
            rdl_invoice_details: z.array(z.object({
                db_id: z.string().optional(),
                rdl_invoice_id: z.string(),
                proceed_value: z.number(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_edit = ctx.permissions[m.PROCEED_REALIZATION]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to edit proceed realization.",
                    });
                }

                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const updatedProceedRealization = await tx.proceed_realization.update({
                        where: {
                            id: input.id,
                        },
                        data: {
                            realization_date: input.realization_date,
                            bank_charge: input.bank_charge,
                            document_charge: input.document_charge,
                            discount_charge: input.discount_charge,
                        },
                    });

                    await Promise.all([
                        await tx.proceed_realization_history.create({
                            data: {
                                proceed_realization_id: updatedProceedRealization.id,
                                buyer_id: updatedProceedRealization.buyer_id,
                                document_submission_id: updatedProceedRealization.document_submission_id,
                                term_id: updatedProceedRealization.term_id,
                                realization_date: updatedProceedRealization.realization_date,
                                bank_charge: updatedProceedRealization.bank_charge,
                                document_charge: updatedProceedRealization.document_charge,
                                discount_charge: updatedProceedRealization.discount_charge,
                                action_type: actions.UPDATE,
                                action_by: ctx.user.id,
                            },
                        }),

                        await Promise.all(input.rdl_invoice_details.map(async (detail) => {
                            if (detail.db_id) {
                                await tx.proceed_realization_details.update({
                                    where: {
                                        id: detail.db_id,
                                    },
                                    data: {
                                        realized_amount: detail.proceed_value,
                                    },
                                });
                                
                                await tx.proceed_realization_details_history.create({
                                    data: {
                                        realization_details_id: detail.db_id,
                                        realization_id: updatedProceedRealization.id,
                                        rdl_invoice_id: detail.rdl_invoice_id,
                                        action_type: actions.UPDATE,
                                        action_by: ctx.user.id,
                                    },
                                });
                            }
                        }))
                    ])
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

});