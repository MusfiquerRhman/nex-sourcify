import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { CrossPaymentDetails, CrossPaymentList } from './_types/crossPayment';

export const crossPaymentsRouter = createTRPCRouter({
    addCrossPayment: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
            cross_payment_date: z.date(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                factory_invoice_id: z.string(),
                value: z.number(),
                factory_payment_no: z.string().optional(),
                factory_payment_date: z.date().optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.CROSS_PAYMENT]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add cross payment.",
                });
            }

            try {
                const currentYear = new Date().getFullYear();
                
                return await ctx.db.$transaction(async (tx) => {
                    const meta = await tx.cross_payments_metadata.upsert({
                        where: { 
                            year_buyer_id: {
                                year: currentYear,
                                buyer_id: input.buyer_id,
                            }
                        },
                        update: {
                            last_ref: {
                                increment: 1,
                            },
                        },
                        create: {
                            year: currentYear,
                            last_ref: 1,
                            buyer_id: input.buyer_id,
                        },
                    });
                    
                    const buyer_prefix = await tx.buyers.findUnique({
                        where: { id: input.buyer_id },
                        select: { prefix: true },
                    });

                    if(!buyer_prefix) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: "Buyer prefix not found."
                        });
                    }

                    const ref_no = `CROSS PAY/${buyer_prefix.prefix}/${currentYear}/${String(meta.last_ref).padStart(4, '0')}`;

                    const crossPayment = await tx.cross_payments.create({
                        data: {
                            term_id: input.term_id,
                            buyer_id: input.buyer_id,
                            cross_payment_ref: ref_no,
                            cross_payment_date: new Date(input.cross_payment_date),
                            remarks: input.remarks,
                        },
                    });

                    await tx.cross_payments_history.create({
                        data: {
                            cross_payments_id: crossPayment.id,
                            buyer_id: input.buyer_id,
                            cross_payment_date: input.cross_payment_date,
                            cross_payment_ref: crossPayment.cross_payment_ref,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        const crossPaymentDetailsData = input.details.map((detail) => ({
                            cross_payment_id: crossPayment.id,
                            factory_invoice_id: detail.factory_invoice_id,
                            value: detail.value,
                            factory_payment_no: detail.factory_payment_no,
                            factory_payment_date: detail.factory_payment_date,
                        }));

                        await tx.cross_payment_details.createMany({
                            data: crossPaymentDetailsData,
                        });
                    }

                    const addedDetails = await tx.cross_payment_details.findMany({
                        where: { cross_payment_id: crossPayment.id },
                    });

                    await tx.cross_payment_details_history.createMany({
                        data: addedDetails.map((detail) => ({
                            cross_payment_details_id: detail.id,
                            cross_payment_id: crossPayment.id,
                            factory_invoice_id: detail.factory_invoice_id,
                            factory_payment_no: detail.factory_payment_no,
                            factory_payment_date: detail.factory_payment_date,
                            value: detail.value,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        })),
                    });

                    return crossPayment;
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFactoryInvoicesByBuyer: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
            cross_payment_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view factory invoices.",
                });
            }
            
            try {
                const crossPaymentClause = !!input.cross_payment_id ?
                    Prisma.sql`AND CPD.cross_payment_id <> ${input.cross_payment_id}` :
                    Prisma.empty;

                const unionClause = !!input.cross_payment_id ?
                    Prisma.sql`
                        UNION
                        (
                            SELECT DISTINCT
                                FI.id,
                                FI.invoice_no,
                                FI.added_at
                            FROM factory_invoice AS FI
                            INNER JOIN cross_payment_details AS CPD
                                ON CPD.factory_invoice_id = FI.id
                            WHERE CPD.cross_payment_id = ${input.cross_payment_id ?? ""}
                            AND FI.buyer_id = ${input.buyer_id}
                            AND FI.term_id = ${input.term_id}
                        )` 
                    : Prisma.empty;

                const factoryInvoices = await ctx.db.$queryRaw<{ id: string; invoice_no: string }[]>`
                    (
                        SELECT DISTINCT
                            FI.id,
                            FI.invoice_no,
                            FI.added_at
                        FROM factory_invoice AS FI
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM proceed_realization_details AS PRD
                                INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = PRD.rdl_invoice_id
                                INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = RID.factory_invoice_id
                            WHERE FID.factory_invoice_id = FI.id
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM rdl_invoice_details AS RID
                            WHERE RID.factory_invoice_id = FI.id
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM cross_payment_details AS CPD
                            WHERE CPD.factory_invoice_id = FI.id
                            ${crossPaymentClause}
                        )
                        AND FI.buyer_id = ${input.buyer_id}
                        AND FI.term_id = ${input.term_id}
                    )
                    ${unionClause}
                    ORDER BY added_at DESC;
                `;
            
                return factoryInvoices;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    getFactoryInvoiceDetails: protectedProcedure
        .input(z.object({
            factory_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;    

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view factory invoice details.",
                });
            }
            
            try {
                const factoryInvoiceDetails = await ctx.db.$queryRaw<CrossPaymentDetails[]>`
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
                        FI.ID AS DB_ID,
                        F.NAME AS FACTORY_NAME,
                        FI.ID AS FACTORY_INVOICE_ID,
                        FI.INVOICE_NO AS FACTORY_INVOICE_NO,
                        FI.INVOICE_DATE AS FACTORY_INVOICE_DATE,
                        SUM(FR.QUANTITY)::NUMERIC(18, 2) AS INVOICE_QUANTITY,
                        SUM(FR.VALUE)::NUMERIC(18, 2) AS INVOICE_VALUE
                    FROM factory_invoice AS FI
                        INNER JOIN factories AS F ON F.id = FI.factory_id
                        INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                        INNER JOIN FOB_RATE AS FR ON FR.RIDI = RID.id
                    WHERE FI.ID = ${input.factory_invoice_id}
                    GROUP BY FI.ID, F.ID;
                `;

                return factoryInvoiceDetails;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getCrossPaymentList: protectedProcedure
        .input(z.object({
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view cross payments.",
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<CrossPaymentList[]>`
                    WITH CROSS_PAYS AS (
                        SELECT 
                            CP.id,
                            CP.CROSS_PAYMENT_REF,
                            CP.CROSS_PAYMENT_DATE,
                            B.BUYER_NAME,
                            T.NAME AS TERM_NAME,
                            SUM(CPD.VALUE) AS PAID_AMOUNT,
                            CP.IS_AUTHORIZED,
                            CP.ADDED_AT
                        FROM CROSS_PAYMENTS AS CP
                            INNER JOIN CROSS_PAYMENT_DETAILS AS CPD ON CPD.cross_payment_id = CP.id
                            INNER JOIN BUYERS AS B ON B.id = CP.buyer_id
                            INNER JOIN TERMS AS T ON T.id = CP.term_id
                        WHERE EXISTS ( -- Admin
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
                        GROUP BY CP.ID, B.ID, T.ID
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CROSS_PAYS
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const crossPayments = result.map(({ total_count: _, ...invoice}) => invoice);

                return { total, crossPayments };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchCrossPayments: protectedProcedure
        .input(z.object({
            query: z.string(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if (!can_view) {    
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to search cross payments.",
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<CrossPaymentList[]>`
                    WITH CROSS_PAYS AS (
                        SELECT DISTINCT
                            CP.id,
                            CP.CROSS_PAYMENT_REF,
                            CP.CROSS_PAYMENT_DATE,
                            B.BUYER_NAME,
                            T.NAME AS TERM_NAME,
                            SUM(CPD.VALUE) AS PAID_AMOUNT,
                            CP.IS_AUTHORIZED,
                            CP.ADDED_AT
                        FROM CROSS_PAYMENTS AS CP
                            INNER JOIN CROSS_PAYMENT_DETAILS AS CPD ON CPD.cross_payment_id = CP.id
                            INNER JOIN BUYERS AS B ON B.id = CP.buyer_id
                            INNER JOIN TERMS AS T ON T.id = CP.term_id
                            INNER JOIN FACTORY_INVOICE AS FI ON FI.id = CPD.factory_invoice_id
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
                            CP.CROSS_PAYMENT_REF ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR FI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY CP.ID, B.ID, T.ID
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CROSS_PAYS
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const crossPayments = result.map(({ total_count: _, ...invoice}) => invoice);

                return { total, crossPayments };
            }
            catch (error) {
                console.error('Error in searchCrossPayments:', error);
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteCrossPayment: protectedProcedure
        .input(z.object({
            cross_payment_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.CROSS_PAYMENT]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete cross payments.",
                });
            }

            const getAuthorization = await ctx.db.cross_payments.findUnique({
                where: {
                    id: input.cross_payment_id
                },
                select: {
                    is_authorized: true
                }
            });

            if(!getAuthorization?.is_authorized) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: "This Cross Payment has been approved and can't be deleted"
                })
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const crossPaymentDetails = await tx.cross_payment_details.findMany({
                        where: { cross_payment_id: input.cross_payment_id },
                    });

                    const deletedCrossPayment = await tx.cross_payments.delete({
                        where: { id: input.cross_payment_id },
                    });
                    
                    await Promise.all([
                        await tx.cross_payment_details.deleteMany({
                            where: { cross_payment_id: input.cross_payment_id },
                        }),

                        await tx.cross_payment_details_history.createMany({
                            data: crossPaymentDetails.map((detail) => ({
                                cross_payment_details_id: detail.id,
                                cross_payment_id: input.cross_payment_id,
                                factory_invoice_id: detail.factory_invoice_id,
                                factory_payment_no: detail.factory_payment_no,
                                factory_payment_date: detail.factory_payment_date,
                                value: detail.value,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        }),
    
                        await tx.cross_payments_history.create({
                            data: {
                                cross_payments_id: deletedCrossPayment.id,
                                buyer_id: deletedCrossPayment.buyer_id,
                                cross_payment_date: deletedCrossPayment.cross_payment_date,
                                cross_payment_ref: deletedCrossPayment.cross_payment_ref,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        }),
                    ]);
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getCrossPaymentById: protectedProcedure
        .input(z.object({
            cross_payment_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view cross payment details.",
                });
            }
            
            try {
                const crossPayment = await ctx.db.cross_payments.findUnique({
                    where: { id: input.cross_payment_id },
                    select: {
                        id: true,
                        cross_payment_ref: true,
                        term_id: true,
                        buyer_id: true,
                        cross_payment_date: true,
                        remarks: true,
                        cross_payment_details: {
                            select: {
                                id: true,
                                factory_invoice_id: true,
                                factory_invoice: {
                                    select: {
                                        invoice_no: true,
                                    }
                                },
                                factory_payment_no: true,
                                factory_payment_date: true,
                                regularized: true,
                                value: true,
                            },
                        }
                    },
                });

                if (!crossPayment) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Cross payment not found.",
                    });
                }

                return crossPayment;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateCrossPayment: protectedProcedure
        .input(z.object({
            cross_payment_id: z.string(),
            cross_payment_date: z.date(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                db_id: z.string().optional(),
                value: z.number(),
                factory_invoice_id: z.string(),
                factory_payment_no: z.string().optional(),
                factory_payment_date: z.date().optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_edit = ctx.permissions[m.CROSS_PAYMENT]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to update cross payments.",
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const updatedCrossPayment = await tx.cross_payments.update({
                        where: { id: input.cross_payment_id },
                        data: {
                            cross_payment_date: input.cross_payment_date,
                            remarks: input.remarks,
                        },
                    });

                    await tx.cross_payments_history.create({
                        data: {
                            cross_payments_id: updatedCrossPayment.id,
                            buyer_id: updatedCrossPayment.buyer_id,
                            cross_payment_date: updatedCrossPayment.cross_payment_date,
                            cross_payment_ref: updatedCrossPayment.cross_payment_ref,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        for (const detail of input.details) {
                            if (detail.db_id) {
                                // Update existing detail
                                await tx.cross_payment_details.update({
                                    where: { id: detail.db_id },
                                    data: {
                                        value: detail.value,
                                        factory_payment_no: detail.factory_payment_no,
                                        factory_payment_date: detail.factory_payment_date,
                                    },
                                });

                                await tx.cross_payment_details_history.create({
                                    data: {
                                        cross_payment_details_id: detail.db_id,
                                        cross_payment_id: input.cross_payment_id,
                                        factory_invoice_id: detail.factory_invoice_id,
                                        factory_payment_no: detail.factory_payment_no,
                                        factory_payment_date: detail.factory_payment_date,
                                        value: detail.value,
                                        action_type: actions.UPDATE,
                                        action_by: ctx.user.id,
                                    },
                                });
                            }
                            else {
                                // Create new detail
                                await tx.cross_payment_details.create({
                                    data: {
                                        cross_payment_id: input.cross_payment_id,
                                        factory_invoice_id: detail.factory_invoice_id,
                                        value: detail.value,
                                        factory_payment_no: detail.factory_payment_no,
                                        factory_payment_date: detail.factory_payment_date,
                                    },
                                });

                                await tx.cross_payment_details_history.create({
                                    data: {
                                        cross_payment_id: input.cross_payment_id,
                                        factory_invoice_id: detail.factory_invoice_id,
                                        factory_payment_no: detail.factory_payment_no,
                                        factory_payment_date: detail.factory_payment_date,
                                        value: detail.value,
                                        action_type: actions.ADDED,
                                        action_by: ctx.user.id,
                                    },
                                });
                            }
                        }
                    }
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteFactoryInvoiceFromCrossPayment: protectedProcedure
        .input(z.object({
            db_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_edit = ctx.permissions[m.CROSS_PAYMENT]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to delete factory invoice from cross payment.",
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const detailToDelete = await tx.cross_payment_details.findUnique({
                        where: { id: input.db_id },
                    });

                    if (!detailToDelete) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Cross payment detail not found.",
                        });
                    }

                    await tx.cross_payment_details_history.create({
                        data: {
                            cross_payment_details_id: detailToDelete.id,
                            cross_payment_id: detailToDelete.cross_payment_id,
                            factory_invoice_id: detailToDelete.factory_invoice_id,
                            factory_payment_no: detailToDelete.factory_payment_no,
                            factory_payment_date: detailToDelete.factory_payment_date,
                            value: detailToDelete.value,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    await tx.cross_payment_details.delete({
                        where: { id: input.db_id },
                    });
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkCrossPaymentStatus: protectedProcedure
        .input(z.object({
            cross_payment_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view cross payment status.",
                });
            }
            
            try {
                const crossPayment = await ctx.db.$queryRaw`
                    SELECT
                        CPD.id,
                        FI.invoice_no,
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1
                                FROM document_submission_factory_invoices AS DSFI
                                WHERE DSFI.factory_invoice_id = FI.id
                            ) THEN -2
                            WHEN NOT EXISTS (
                                SELECT 1
                                FROM rdl_invoice_details AS RID
                                INNER JOIN proceed_realization_details AS PRD ON PRD.rdl_invoice_id = RID.rdl_invoice_id
                                WHERE RID.factory_invoice_id = FI.id
                            ) THEN -1
                            WHEN EXISTS (
                                SELECT 1
                                FROM factory_payments AS FP
                                WHERE FP.factory_invoice_id = FI.id
                            ) THEN 1
                            ELSE 0
                        END AS STATUS
                    FROM cross_payments AS CP
                    INNER JOIN cross_payment_details AS CPD ON CPD.cross_payment_id = CP.id
                    INNER JOIN factory_invoice AS FI ON FI.id = CPD.factory_invoice_id
                    WHERE CP.id = ${input.cross_payment_id};
                `;
            
                return crossPayment;
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
            const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view cross payment." 
                });
            }

            try {
                const authorizationState = await ctx.db.cross_payments.findUnique({
                    where: { id: input.id },
                    select: {
                        is_authorized: true,
                    }
                });

                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number}[]>`
                    SELECT 
                        department_id, level_id 
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.CROSS_PAYMENT}
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

    approveCrossPayment: protectedProcedure
        .input(z.object({
            id: z.string(),
            approval_status: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_approve = ctx.permissions[m.CROSS_PAYMENT]?.can_update;

            if(!can_approve) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve cross payment." 
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
                    WHERE module_id = ${m.CROSS_PAYMENT}
                        AND level_id = ${userLevel}
                        AND department_id = ${userDepartment}
                    LIMIT 1;
                `;

                if (can_approve.length === 0 && !isAdmin) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to Authorize this Cross Payment.",
                    });
                }

                const updatedCrossPayment = await ctx.db.cross_payments.update({
                    where: { id: input.id },
                    data: {
                        is_authorized: input.approval_status,
                    }
                });

                await ctx.db.cross_payments_history.create({
                    data: {
                        cross_payments_id: updatedCrossPayment.id,
                        cross_payment_ref: updatedCrossPayment.cross_payment_ref,
                        cross_payment_date: updatedCrossPayment.cross_payment_date,
                        buyer_id: updatedCrossPayment.buyer_id,
                        term_id: updatedCrossPayment.term_id,
                        is_authorized: updatedCrossPayment.is_authorized,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    }
                });

                return updatedCrossPayment;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})