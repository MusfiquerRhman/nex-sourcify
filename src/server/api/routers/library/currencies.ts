import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const currenciesRouter = createTRPCRouter({
    getCurrencies: protectedProcedure.input(
        z.object({
            limit: z.number().min(0).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.CURRENCIES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view currencies." 
            });
        }

        const currenciesObj = await ctx.db.currencies.findMany({
            select: {
                id: true,
                name: true,
                symbol: true,
                currency_code: true,
            },
            orderBy: { added_at: 'desc' },
            take: input.limit,
            skip: input.offset,
        });

        const currencies = currenciesObj.map(currency => ({
            id: currency.id,
            name: currency.name,
            symbol: currency.symbol,
            currency_code: currency.currency_code,
        }));

        const totalCount = await ctx.db.currencies.count();

        return { currencies, totalCount };
    }),

    getCurrencyById: protectedProcedure.input(
        z.object({
            id: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.CURRENCIES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view currencies." 
            });
        }

        const currency = await ctx.db.currencies.findUnique({
            where: { id: parseInt(input.id) },
            select: {  
                id: true,
                name: true,
                symbol: true,
                currency_code: true,
            },
        });

        return currency;
    }),

    addCurrency: protectedProcedure.input(
        z.object({
            name: z.string().min(1),
            symbol: z.string().min(1),
            currency_code: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.CURRENCIES]?.can_add ?? false;

        if(!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add currencies." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const currency = await tx.currencies.create({
                    data: {
                        name: input.name.trim(),
                        symbol: input.symbol.trim(),
                        currency_code: input.currency_code?.trim(),
                    },
                });

                await tx.currencies_history.create({
                    data: {
                        currency_id: currency.id,
                        name: currency.name?.trim(),
                        symbol: currency.symbol?.trim(),
                        currency_code: currency.currency_code?.trim(),
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    },
                });
                return currency;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    updateCurrency: protectedProcedure.input(
        z.object({
            id: z.string(),
            name: z.string().min(1),
            symbol: z.string().min(1),
            currency_code: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_update = ctx.permissions[m.CURRENCIES]?.can_update ?? false;

        if(!can_update) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to update currencies." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                await tx.currencies_history.create({
                    data: {
                        currency_id: parseInt(input.id),
                        name: input.name.trim(),
                        symbol: input.symbol.trim(),
                        currency_code: input.currency_code?.trim(),
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    },
                });

                const updatedCurrency = await tx.currencies.update({
                    where: { id: parseInt(input.id) },
                    data: {
                        name: input.name.trim(),
                        symbol: input.symbol.trim(),
                        currency_code: input.currency_code?.trim(),
                    },
                });

                return updatedCurrency;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    searchCurrencies: protectedProcedure.input(
        z.object({
            query: z.string().min(1),
            limit: z.number().min(0).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.CURRENCIES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view currencies." 
            });
        }

        const currenciesObj = await ctx.db.currencies.findMany({
            select: {
                id: true,
                name: true,
                symbol: true,
                currency_code: true,
            },
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { symbol: { contains: input.query, mode: "insensitive" } },
                    { currency_code: { contains: input.query, mode: "insensitive" } },
                ],
            },
            take: input.limit,
            skip: input.offset,
        });

        const currencies = currenciesObj.map(currency => ({
            id: currency.id,
            name: currency.name,
            symbol: currency.symbol,
            currency_code: currency.currency_code,
        }));

        const total = await ctx.db.currencies.count({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { symbol: { contains: input.query, mode: "insensitive" } },
                    { currency_code: { contains: input.query, mode: "insensitive" } },
                ],
            },
        });

        return { currencies, total };
    }),

    deleteCurrency: protectedProcedure.input(
        z.object({
            id: z.number(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.CURRENCIES]?.can_delete ?? false;

        if(!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete currencies." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const currency = await tx.currencies.delete({
                    where: { id: input.id },
                });

                if(!currency) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Currency not found." 
                    });
                }

                await tx.currencies_history.create({
                    data: {
                        currency_id: currency.id,
                        name: currency.name,
                        symbol: currency.symbol,
                        currency_code: currency.currency_code,
                        action_type: 'DELETE',
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


    // For dropdowns
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const currencies = await ctx.db.currencies.findMany({
            select: {
                id: true,
                name: true,
            }
        });

        return currencies;
    }),

});