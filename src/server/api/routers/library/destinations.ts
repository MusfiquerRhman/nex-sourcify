import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const destinationsRouter = createTRPCRouter({
    getDestinations: protectedProcedure.input(
        z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.DESTINATIONS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view destinations." 
            });
        }

        const destinationsObj = await ctx.db.destinations.findMany({
            select: {
                id: true,
                name: true,
                countries: {
                    select: { 
                        id: true, 
                        name: true 
                    }
                },
            },
            orderBy: { added_at: 'desc' },
            skip: input.offset,
            take: input.limit,
        });

        const destinations = destinationsObj.map(dest => ({
            ...dest,
            country_id: dest.countries?.id,
            country_name: dest.countries?.name,
        }));

        const total = await ctx.db.destinations.count();

        return { destinations, total };

    }),


    getDestinationById: protectedProcedure.input(
        z.object({
            id: z.string().min(1),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.DESTINATIONS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view destinations." 
            });
        }

        const destinationObj = await ctx.db.destinations.findUnique({
            where: { id: parseInt(input.id) },
            select: {
                id: true,
                name: true,
                countries: {
                    select: { 
                        id: true, 
                        name: true 
                    }
                },
            },
        });

        const destination = destinationObj ? {
            ...destinationObj,
            country_id: destinationObj.countries?.id,
            country_name: destinationObj.countries?.name,
        } : null;

        return destination;
    }),


    addDestination: protectedProcedure.input(
        z.object({
            name: z.string().min(2),
            country_id: z.number().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.DESTINATIONS]?.can_add ?? false;

        if (!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add destinations." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const destination = await tx.destinations.create({
                    data: {
                        name: input.name.trim(),
                        country_id: input.country_id,
                    },
                });

                await tx.destinations_history.create({
                    data: {
                        destination_id: destination.id,
                        name: destination.name?.trim(),
                        country_id: destination.country_id,
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    },
                });

                return destination;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),


    deleteDestination: protectedProcedure.input(
        z.object({
            id: z.number().min(1),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.DESTINATIONS]?.can_delete ?? false;

        if (!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete destinations." 
            });
        }
        
        try {
            return await ctx.db.$transaction(async (tx) => {
                const destination = await tx.destinations.delete({
                    where: { id: input.id },
                });

                if(!destination) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Destination not found." 
                    });
                }

                await tx.destinations_history.create({
                    data: {
                        destination_id: destination.id,
                        name: destination.name,
                        country_id: destination.country_id,
                        action_type: actions.DELETE,
                        action_by: ctx.user.id,
                    },
                })
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),


    updateDestination: protectedProcedure.input(
        z.object({
            id: z.number().min(1),
            name: z.string().min(2),
            country_id: z.number().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_update = ctx.permissions[m.DESTINATIONS]?.can_update ?? false;

        if (!can_update) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to update destinations." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                await tx.destinations_history.create({
                    data: {
                        destination_id: input.id,
                        name: input.name.trim(),
                        country_id: input.country_id,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    },
                });

                const updatedDestination = await tx.destinations.update({
                    where: { id: input.id },
                    data: {
                        name: input.name?.trim(),
                        country_id: input.country_id,
                    },
                });

                return updatedDestination;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }

    }),


    searchDestinations: protectedProcedure.input(
        z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.DESTINATIONS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view destinations." 
            });
        }

        const destinationsObj = await ctx.db.destinations.findMany({
            where: {
                OR : [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { countries: { name: { contains: input.query, mode: "insensitive" } } },
                ],
            },
            select: {
                id: true,
                name: true,
                countries: {
                    select: { 
                        id: true, 
                        name: true
                    }
                },
            },
            skip: input.offset,
            take: input.limit,
        });

        const destinations = destinationsObj.map(dest => ({
            ...dest,
            country_id: dest.countries?.id,
            country_name: dest.countries?.name,
        }));

        const total = await ctx.db.destinations.count({
            where: {
                OR : [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { countries: { name: { contains: input.query, mode: "insensitive" } } },
                ],
            },
        });

        return { destinations, total };
    }),

    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.destinations.findMany({
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                },
            });
        }),

    
});