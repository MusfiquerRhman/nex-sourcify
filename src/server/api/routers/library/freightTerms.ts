import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { m } from "~/utils/moduleMap";
import { TRPCError } from "@trpc/server";
import { actions } from "@prisma/client";

export const freightTermsRouter = createTRPCRouter({
    getFreightTerms: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            try {
                const freightTerms = await ctx.db.freight_term.findMany({
                    orderBy: {
                        added_at: "desc",
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                    take: input.limit,
                    skip: input.offset,
                });

                const count = await ctx.db.freight_term.count();
    
                return {
                    freightTerms,
                    total: count,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
            
        }),

    searchFreightTerms: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FREIGHT_TERMS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Freight Terms." 
                });
            }
            
            try {
                const freightTerms = await ctx.db.freight_term.findMany({
                    where: {
                        name: {
                            contains: input.query,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        added_at: "desc",
                    },
                    take: input.limit,
                    skip: input.offset,
                });

                const count = await ctx.db.freight_term.count({
                    where: {
                        name: {
                            contains: input.query,
                        },
                    },
                });

                return {
                    freightTerms,
                    total: count,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteFreightTerm: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FREIGHT_TERMS]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Freight Terms." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const freightTerm = await tx.freight_term.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    await tx.freight_term_history.create({
                        data: {
                            freight_term_id: freightTerm.id,
                            name: freightTerm.name,
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

    addFreightTerm: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.FREIGHT_TERMS]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add Freight Terms." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const freightTerm = await tx.freight_term.create({
                        data: {
                            name: input.name.trim(),
                        },
                    });

                    await tx.freight_term_history.create({
                        data: {
                            freight_term_id: freightTerm.id,
                            name: freightTerm.name.trim(),
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    return freightTerm;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateFreightTerm: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.FREIGHT_TERMS]?.can_update;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update Freight Terms." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const freightTerm = await tx.freight_term.update({
                        where: {
                            id: input.id,
                        },
                        data: {
                            name: input.name.trim(),
                        },
                    });

                    await tx.freight_term_history.create({
                        data: {
                            freight_term_id: input.id,
                            name: input.name.trim(),
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    return freightTerm;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFreightTermById: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FREIGHT_TERMS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Freight Terms." 
                });
            }
            
            try {
                return await ctx.db.freight_term.findUnique({
                    where: {
                        id: input.id,
                    },
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
        try {
            const freightTerms = await ctx.db.freight_term.findMany({
                orderBy: {
                    name: "asc",
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            
            return freightTerms;
        }
        catch (error) {
                        handlePrismaError(error);
        }
    }),

});
