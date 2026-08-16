import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const paymentTermsRouter = createTRPCRouter({
    getPaymentTerms: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PAYMENT_TERMS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view payment terms." 
                });
            }

            const paymentTermsObj = await ctx.db.payment_terms.findMany({
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    terms: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tenor: true,
                    term_description: true,
                },
            });

            const total = await ctx.db.payment_terms.count();

            const paymentTerms = paymentTermsObj.map(({terms, ...rest}) => ({
                ...rest,
                terms_id: terms.id,
                terms_name: terms.name
            }));

            return {paymentTerms, total};
        }),

    getPaymentTermById: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PAYMENT_TERMS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view payment terms." 
                });
            }

            const paymentTermObj = await ctx.db.payment_terms.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    terms: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tenor: true,
                    term_description: true,
                },
            });

            const paymentTerm = paymentTermObj ? {
                ...paymentTermObj,
                terms_id: paymentTermObj.terms?.id,
                terms_name: paymentTermObj.terms?.name,
            } : null;

            return paymentTerm;
        }),

    addPaymentTerm: protectedProcedure
        .input(
            z.object({
                terms_id: z.number().min(1),
                tenor: z.number().min(0),
                term_description: z.string().max(255),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.PAYMENT_TERMS]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add payment terms." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const paymentTerm = await tx.payment_terms.create({
                        data: {
                            term_id: input.terms_id,
                            tenor: input.tenor,
                            term_description: input.term_description.trim(),
                        },
                    });

                    await tx.payment_terms_history.create({
                        data: {
                            payment_terms_id: paymentTerm.id,
                            term_id: paymentTerm.term_id,
                            tenor: paymentTerm.tenor,
                            term_description: paymentTerm.term_description.trim(),
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    return paymentTerm;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updatePaymentTerm: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
                terms_id: z.number().min(1),
                tenor: z.number().min(0),
                term_description: z.string().max(255),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.PAYMENT_TERMS]?.can_update;

            if (!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to edit payment terms." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedPaymentTerm = await tx.payment_terms.update({
                        where: { id: input.id },
                        data: {
                            term_id: input.terms_id,
                            tenor: input.tenor,
                            term_description: input.term_description.trim(),
                        },
                    });

                    await tx.payment_terms_history.create({
                        data: {
                            payment_terms_id: input.id,
                            term_id: updatedPaymentTerm.term_id,
                            tenor: input.tenor,
                            term_description: input.term_description.trim(),
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    return updatedPaymentTerm;

                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deletePaymentTerm: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.PAYMENT_TERMS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete payment terms." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const paymentTerm = await tx.payment_terms.delete({
                        where: { id: input.id },
                    });

                    if(!paymentTerm) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Payment term not found." 
                        });
                    }

                    await tx.payment_terms_history.create({
                        data: {
                            payment_terms_id: paymentTerm.id,
                            term_id: paymentTerm.term_id,
                            tenor: paymentTerm.tenor,
                            term_description: paymentTerm.term_description,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    searchPaymentTerms: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PAYMENT_TERMS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view payment terms." 
                });
            }

            const paymentTermsObj = await ctx.db.payment_terms.findMany({
                where: {
                    OR: [
                        {term_description: { contains: input.query, mode: "insensitive"  } },
                        {tenor: { equals: isNaN(Number(input.query)) ? undefined : Number(input.query) } },
                        {terms: { name: { contains: input.query, mode: "insensitive" } } },
                    ]
                },
                take: input.limit,
                skip: input.offset,
                select: {
                    id: true,
                    terms: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tenor: true,
                    term_description: true,
                },
            });

            const total = await ctx.db.payment_terms.count({
                where: {
                    OR: [
                        {term_description: { contains: input.query, mode: "insensitive"  } },
                        {tenor: { equals: isNaN(Number(input.query)) ? undefined : Number(input.query) } },
                        {terms: { name: { contains: input.query, mode: "insensitive" } } },
                    ]
                },
            });

            const paymentTerms = paymentTermsObj.map(({terms, ...rest}) => ({
                ...rest,
                terms_id: terms?.id,
                terms_name: terms?.name,
            }));

            return { paymentTerms, total };
        }),


    getAll: protectedProcedure
        .input(z.object({
            term: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const paymentTerms = await ctx.db.payment_terms.findMany({
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    term_description: true,
                    tenor: true,
                    terms: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
                where: {
                    term_id: input.term ?? undefined,
                }
            });

            return paymentTerms;
        }),

});