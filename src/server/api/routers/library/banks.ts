import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const banksRouter = createTRPCRouter({
    getBanks: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BANKS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view banks." 
                });
            }

            const banksObj = await ctx.db.banks.findMany({
                take: input.limit,
                skip: input.offset,
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { added_at: 'desc' },
            });

            const total = await ctx.db.banks.count();

            const banks = banksObj.map(({countries, ...bank}) => ({
                ...bank,
                country_names: countries?.name,
                country_id: countries?.id,
            }));

            return { banks, total };
        }),

    getBankById: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BANKS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view banks." 
                });
            }

            const bankObj = await ctx.db.banks.findUnique({
                where: { id: parseInt(input.id) },
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            const bank = bankObj ? {
                ...bankObj,
                country_names: bankObj.countries?.name,
                country_id: bankObj.countries?.id,
            } : null;

            return bank;
        }),


    addBank: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                country_id: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.BANKS]?.can_add ?? false;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add banks." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const createdBank = await tx.banks.create({
                        data: {
                            name: input.name.trim(),
                            country_id: input.country_id,
                        },
                    });

                    await tx.banks_history.create({
                        data: {
                            name: createdBank.name,
                            country_id: createdBank.country_id,
                            bank_id: createdBank.id,
                            action_type: 'ADDED',
                            action_by: ctx.user.id,
                        },
                    });

                    return createdBank;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteBank: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BANKS]?.can_delete ?? false;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete banks." 
                });
            }

            // Use a transaction to ensure both operations succeed or fail together
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const bank = await tx.banks.delete({
                        where: { id: input.id },
                    });

                    if (!bank) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Bank not found." 
                        });
                    }

                    await tx.banks_history.create({
                        data: {
                            name: bank.name,
                            bank_id: bank.id,
                            country_id: bank.country_id,
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

    updateBank: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().min(1),
                country_id: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.BANKS]?.can_update ?? false;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to update banks." 
                });
            }

            // Use a transaction to ensure both operations succeed or fail together
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const bank = await tx.banks.findUnique({
                        where: { id: input.id },
                    });

                    if (!bank) {
                        throw new Error("Bank not found.");
                    }

                    await tx.banks_history.create({
                        data: {
                            name: input.name.trim(),
                            country_id: input.country_id,
                            bank_id: input.id,
                            action_type: 'UPDATE',
                            action_by: ctx.user.id,
                        },
                    });

                    const updatedBank = await ctx.db.banks.update({
                        where: { id: input.id },
                        data: {
                            name: input.name.trim(),
                            country_id: input.country_id,
                        },
                    });

                    return updatedBank;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    searchBanks: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BANKS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view banks." 
                });
            }

            const banksObj = await ctx.db.banks.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { countries: { name: { contains: input.query, mode: "insensitive" } } },
                    ],
                },
                take: input.limit,
                skip: input.offset,
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            const total = await ctx.db.banks.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { countries: { name: { contains: input.query, mode: "insensitive" } } },
                    ],
                },
            });

            const banks = banksObj.map(({countries, ...bankObj}) => ({
                ...bankObj,
                country_names: countries?.name,
                country_id: countries?.id,
            }));

            return {banks, total};
        }),

    getAllBanks: protectedProcedure
        .query(async ({ ctx }) => {
            const banks = await ctx.db.banks.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            });

            return banks;
        }),
});