import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const overseasOfficesRouter = createTRPCRouter({
    getOverseasOffices: protectedProcedure.input(
        z.object({
            limit: z.number().min(0).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.OVERSEAS_OFFICES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view overseas offices." 
            });
        }

        const overseasOfficesObj = await ctx.db.overseas_offices.findMany({
            select: {
                id: true,
                name: true,
                email_address: true,
                phone_no: true,
                currencies: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                city: true,
                street: true,
                zip: true,
            },
            orderBy: { added_at: 'desc' },
            take: input.limit,
            skip: input.offset,
        });

        // flatten the overseas offices data
        const overseasOffices = overseasOfficesObj.map(({currencies, countries, ...rest}) => ({
            ...rest,
            currency_id: currencies?.id,
            currency: currencies?.name,
            country_id: countries?.id,
            country: countries?.name,
        }));

        const total = await ctx.db.overseas_offices.count();

        return { overseasOffices, total };
    }),

    getOverseasOfficeById: protectedProcedure.input(
        z.object({
            id: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.OVERSEAS_OFFICES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view overseas offices." 
            });
        }

        const overseasOfficeObj = await ctx.db.overseas_offices.findUnique({
            where: { id: parseInt(input.id) },
            select: {
                id: true,
                name: true,
                email_address: true,
                phone_no: true,
                currencies: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                city: true,
                street: true,
                zip: true,
            },
        });

        //flatten the overseas office data
        const overseasOffices = overseasOfficeObj ? {
            ...overseasOfficeObj,
            currency_id: overseasOfficeObj.currencies?.id,
            currency: overseasOfficeObj.currencies?.name,
            country_id: overseasOfficeObj.countries?.id,
            country: overseasOfficeObj.countries?.name,
        } : null;

        return overseasOffices;
    }),


    addOverseasOffice: protectedProcedure.input(
        z.object({
            name: z.string().min(2),
            email_address: z.string().optional(),
            phone_no: z.string().optional(),
            currency_id: z.number().optional(),
            country_id: z.number().optional(),
            city: z.string().optional(),
            street: z.string().optional(),
            zip: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.OVERSEAS_OFFICES]?.can_add ?? false;

        if(!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add overseas offices." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const overseasOffice = await tx.overseas_offices.create({
                    data: {
                        name: input.name?.trim(),
                        email_address: input.email_address?.trim(),
                        phone_no: input.phone_no,
                        currency_id: input.currency_id,
                        country_id: input.country_id,
                        city: input.city?.trim(),
                        street: input.street?.trim(),
                        zip: input.zip?.trim(),
                    },
                });

                await tx.overseas_office_history.create({
                    data: {
                        overseas_office_id: overseasOffice.id,
                        name: overseasOffice.name?.trim(),
                        email_address: overseasOffice.email_address?.trim(),
                        phone_no: overseasOffice.phone_no,
                        currency_id: overseasOffice.currency_id,
                        country_id: overseasOffice.country_id,
                        city: overseasOffice.city?.trim(),
                        street: overseasOffice.street?.trim(),
                        zip: overseasOffice.zip?.trim(),
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    },
                });
                return overseasOffice;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    deleteOverseasOffice: protectedProcedure.input(
        z.object({
            id: z.number(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.OVERSEAS_OFFICES]?.can_delete ?? false;

        if(!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete overseas offices." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const overseasOffice = await tx.overseas_offices.delete({
                    where: { id: input.id },
                });

                if(!overseasOffice) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Overseas office not found." 
                    });
                }

                await tx.overseas_office_history.create({
                    data: {
                        overseas_office_id: overseasOffice.id,
                        name: overseasOffice.name,
                        email_address: overseasOffice.email_address,
                        phone_no: overseasOffice.phone_no,
                        currency_id: overseasOffice.currency_id,
                        country_id: overseasOffice.country_id,
                        city: overseasOffice.city,
                        street: overseasOffice.street,
                        zip: overseasOffice.zip,
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

    updateOverseasOffice: protectedProcedure.input(
        z.object({
            id: z.string(),
            name: z.string().min(2),
            email_address: z.string().optional(),
            phone_no: z.string().optional(),
            currency_id: z.number().optional(),
            country_id: z.number().optional(),
            city: z.string().optional(),
            street: z.string().optional(),
            zip: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_update = ctx.permissions[m.OVERSEAS_OFFICES]?.can_update ?? false;

        if(!can_update) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to update overseas offices." });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                await tx.overseas_office_history.create({
                    data: {
                        overseas_office_id: parseInt(input.id),
                        name: input.name.trim(),
                        email_address: input.email_address?.trim(),
                        phone_no: input.phone_no,
                        currency_id: input.currency_id,
                        country_id: input.country_id,
                        city: input.city?.trim(),
                        street: input.street?.trim(),
                        zip: input.zip?.trim(),
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    },
                });

                const updatedOverseasOffice = await tx.overseas_offices.update({
                    where: { id: parseInt(input.id) },
                    data: {
                        name: input.name.trim(),
                        email_address: input.email_address?.trim(),
                        phone_no: input.phone_no,
                        currency_id: input.currency_id,
                        country_id: input.country_id,
                        city: input.city?.trim(),
                        street: input.street?.trim(),
                        zip: input.zip?.trim(),
                    },
                });

                return updatedOverseasOffice;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    searchOverseasOffices: protectedProcedure.input(
        z.object({
            query: z.string().min(1),
            limit: z.number().min(0).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.OVERSEAS_OFFICES]?.can_view ?? false;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view overseas offices." 
            });
        }

        const overseasOfficesObj = await ctx.db.overseas_offices.findMany({
            select: {
                id: true,
                name: true,
                email_address: true,
                phone_no: true,
                currencies: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                city: true,
                street: true,
                zip: true,
            },
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { email_address: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { city: { contains: input.query, mode: "insensitive" } },
                    { street: { contains: input.query, mode: "insensitive" } },
                    { zip: { contains: input.query, mode: "insensitive" } },
                    {
                        countries: {
                            name: { contains: input.query, mode: "insensitive" },
                        },
                    },
                    {
                        currencies: {
                            name: { contains: input.query, mode: "insensitive" },
                        },
                    },
                ]
            },
            take: input.limit,
            skip: input.offset,
        });

        const total = await ctx.db.overseas_offices.count({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { email_address: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { city: { contains: input.query, mode: "insensitive" } },
                    { street: { contains: input.query, mode: "insensitive" } },
                    { zip: { contains: input.query, mode: "insensitive" } },
                    {
                        countries: {
                            name: { contains: input.query, mode: "insensitive" },
                        },
                    },
                    {
                        currencies: {
                            name: { contains: input.query, mode: "insensitive" },
                        },
                    },
                ]
            },
        });

        // flatten the overseas offices data
        const overseasOffices = overseasOfficesObj.map(({currencies, countries, ...rest}) => ({
            ...rest,
            currency_id: currencies?.id,
            currency: currencies?.name,
            country_id: countries?.id,
            country: countries?.name,
        }));

        return { overseasOffices, total };
    }),

    getAllOverseasOffices: protectedProcedure.query(async ({ ctx }) => {
        const overseasOffices = await ctx.db.overseas_offices.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        return overseasOffices;
    }),

});