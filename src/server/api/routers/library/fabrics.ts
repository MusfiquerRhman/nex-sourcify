import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const fabricsRouter = createTRPCRouter({
    getFabrics: protectedProcedure.input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FABRICS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view fabrics." 
                });
            }

            const fabricsOObj = await ctx.db.fabrics.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    composition: true,
                    value: true,
                    unit: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    }
                },
                skip: input.offset,
                take: input.limit,
                orderBy: { added_at: "desc" },
            });

            const total = await ctx.db.fabrics.count();

            const fabrics = fabricsOObj.map(({product_types, ...rest}) => ({
                ...rest,
                product_type_id: product_types?.id,
                product_type_name: product_types?.name,
            }));

            return { fabrics, total };
        }),

    getFabricById: protectedProcedure.input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FABRICS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view fabrics."
                });
            }

            const fabricObj = await ctx.db.fabrics.findUnique({
                where: { id: parseInt(input.id) },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    composition: true,
                    value: true,
                    unit: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            const fabric = fabricObj ? {
                ...fabricObj,
                product_type_id: fabricObj.product_types?.id,
                product_type_name: fabricObj.product_types?.name,
            } : null;

            return fabric;
        }),

    addFabric: protectedProcedure.input(
            z.object({
                name: z.string().min(1),
                description: z.string().min(0).optional(),
                composition: z.string().min(0).optional(),
                value: z.number().min(0),
                unit: z.string().min(1),
                product_type_id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.FABRICS]?.can_add ?? false;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add fabrics." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const fabric = await tx.fabrics.create({
                        data: {
                            name: input.name.trim(),
                            description: input.description?.trim(),
                            composition: input.composition?.trim(),
                            value: input.value,
                            unit: input.unit,
                            product_type_id: input.product_type_id,
                        },
                    });

                    await tx.fabrics_history.create({
                        data: {
                            fabrics_id: fabric.id,
                            name: fabric.name?.trim(),
                            description: fabric.description?.trim(),
                            composition: fabric.composition?.trim(),
                            value: fabric.value,
                            unit: fabric.unit,
                            product_type_id: fabric.product_type_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    
                    return fabric;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteFabric: protectedProcedure.input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FABRICS]?.can_delete ?? false;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete fabrics." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const fabric = await tx.fabrics.delete({
                        where: { id: input.id },
                    });

                    if(!fabric) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Fabric not found." 
                        });
                    }

                    await tx.fabrics_history.create({
                        data: {
                            fabrics_id: fabric.id,
                            name: fabric.name,
                            description: fabric.description,
                            composition: fabric.composition,
                            value: fabric.value,
                            unit: fabric.unit,
                            product_type_id: fabric.product_type_id,
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

    updateFabric: protectedProcedure.input(
            z.object({
                id: z.number(),
                name: z.string().min(1),
                description: z.string().min(0).optional(),
                composition: z.string().min(0).optional(),
                value: z.number().min(0),
                unit: z.string().min(1),
                product_type_id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.FABRICS]?.can_update ?? false;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update fabrics." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.fabrics_history.create({
                        data: {
                            fabrics_id: input.id,
                            name: input.name,
                            description: input.description,
                            composition: input.composition,
                            value: input.value,
                            unit: input.unit,
                            product_type_id: input.product_type_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const updated = await tx.fabrics.update({
                        where: { id: input.id },
                        data: {
                            name: input.name,
                            description: input.description,
                            composition: input.composition,
                            value: input.value,
                            unit: input.unit,
                            product_type_id: input.product_type_id,
                        },
                    });

                    return updated;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchFabrics: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FABRICS]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view fabrics." 
                });
            }

            const fabricsOObj = await ctx.db.fabrics.findMany({
                where: {
                    OR: [
                        {name: { contains: input.query, mode: "insensitive" } },
                        {description: { contains: input.query, mode: "insensitive" }},
                        {composition: { contains: input.query, mode: "insensitive" }},
                        {value: { equals: isNaN(Number(input.query)) ? undefined : Number(input.query) }},
                        {unit: { contains: input.query, mode: "insensitive" }},
                        {product_types: {
                            name: { contains: input.query, mode: "insensitive" },
                        } },
                    ]
                },
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    composition: true,
                    value: true,
                    unit: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    }
                },
            });

            const total = await ctx.db.fabrics.count({
                where: {
                    OR: [
                        {name: { contains: input.query, mode: "insensitive" } },
                        {description: { contains: input.query, mode: "insensitive" }},
                        {composition: { contains: input.query, mode: "insensitive" }},
                        {value: { equals: isNaN(Number(input.query)) ? undefined : Number(input.query) }},
                        {unit: { contains: input.query, mode: "insensitive" }},
                        {product_types: {
                            name: { contains: input.query, mode: "insensitive" },
                        } },
                    ]
                },
            });
                    
            const fabrics = fabricsOObj.map(({product_types, ...rest}) => ({
                ...rest,
                product_type_id: product_types?.id,
                product_type_name: product_types?.name,
            }));

            return { fabrics, total };
        }),

    getFabricsByProductTypeId: protectedProcedure.input(
            z.object({
                product_type_id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const fabrics = await ctx.db.fabrics.findMany({
                where: { product_type_id: input.product_type_id },
                select: {
                    id: true,
                    name: true,
                },
            });

            return fabrics;
        }),

});