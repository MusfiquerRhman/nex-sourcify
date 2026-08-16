import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const countriesRouter = createTRPCRouter({
    getCountries: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COUNTRIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view countries." 
                });
            }

            const countriesObj = await ctx.db.countries.findMany({
                select: {
                    id: true,
                    name: true,
                    country_code: true,
                },
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: 'desc' },
            });

            const countries = countriesObj.map(country => ({
                id: country.id,
                name: country.name,
                country_code: country.country_code,
            }));

            const totalCount = await ctx.db.countries.count();

            return { countries, totalCount };
        }),


    getCountryById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COUNTRIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view countries." 
                });
            }

            const countryObj = await ctx.db.countries.findUnique({
                where: { id: parseInt(input.id) },
                select: {
                    id: true,
                    name: true,
                    country_code: true,
                },
            });

            const country = countryObj ? {
                id: countryObj.id,
                name: countryObj.name,
                country_code: countryObj.country_code,
            } : null;

            return country;
        }),

  
    addCountry: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, "Country name is required."),
                country_code: z.string().optional(),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.COUNTRIES]?.can_add ?? false;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add countries." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const country = await tx.countries.create({
                        data: {
                            name: input.name.trim(),
                            country_code: input.country_code,
                        },
                    });

                    await tx.countries_history.create({
                        data: {
                            country_id: country.id,
                            name: country.name.trim(),
                            country_code: country.country_code,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    return country;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

  
    getCountry: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, "Country name is required."),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COUNTRIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view countries." 
                });
            }

            const country = await ctx.db.countries.findFirst({
                where: { id: parseInt(input.id) },
                select: {
                    id: true,
                    name: true,
                    country_code: true,
                },
            });

            return country;
        }),


    updateCountry: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, "Country ID is required."),
                name: z.string().min(1, "Country name is required."),
                country_code: z.string().optional(),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.COUNTRIES]?.can_update ?? false;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update countries." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.countries_history.create({
                        data: {
                            country_id: Number(input.id),
                            name: input.name.trim(),
                            country_code: input.country_code,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const updatedCountry = await tx.countries.update({
                        where: { id: parseInt(input.id) },
                        data: {
                            name: input.name.trim(),
                            country_code: input.country_code,
                        },
                    });

                    return updatedCountry;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteCountry: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1, "Country ID is required."),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.COUNTRIES]?.can_delete ?? false;
            
            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete countries." 
                });
            }   
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const country = await tx.countries.delete({
                        where: { id: input.id },
                    });

                    if (!country) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Country not found." 
                        });
                    }

                    await tx.countries_history.create({
                        data: {
                            country_id: country.id,
                            name: country.name,
                            country_code: country.country_code,
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


    searchCountries: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1, "Search query is required."),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COUNTRIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view countries." 
                });
            }

            const countriesObj = await ctx.db.countries.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { country_code: { contains: input.query, mode: "insensitive" } },
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    country_code: true,
                },
                take: input.limit,
                skip: input.offset,
            });

            const total = await ctx.db.countries.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { country_code: { contains: input.query, mode: "insensitive" } },
                    ]
                }
            });

            const countries = countriesObj.map(country => ({
                id: country.id,
                name: country.name,
                country_code: country.country_code,
            }));

            return { countries, total };
        }),

    // for dropdowns
    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            const countries = await ctx.db.countries.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: "asc",
                },
            });

            return countries;
        }),
});
