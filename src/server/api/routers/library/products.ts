import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const productsRouter = createTRPCRouter({
    getProducts: protectedProcedure.input(
            z.object({
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view products." 
                });
            }

            const productsObj = await ctx.db.products.findMany({
                take: input.limit,
                skip: input.offset, 
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    is_active: true,
                },
            });
                
            const total = await ctx.db.products.count();

            const products = productsObj.map(({product_types, ...rest}) => ({
                ...rest,
                product_type_id: product_types?.id,
                product_type_name: product_types?.name,
            }));

            return {products, total};
        }),

    getProductById: protectedProcedure.input(
            z.object({
                id: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view products." 
                });
            }

            const productObj = await ctx.db.products.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    is_active: true,
                },
            });

            const product = productObj ? {
                ...productObj,
                product_type_id: productObj.product_types?.id,
                product_type_name: productObj.product_types?.name,
            } : null;

            return product;
        }),

    addProducts: protectedProcedure.input(
            z.object({
                name: z.string().min(1),
                product_type_id: z.number().optional(),
                is_active: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.PRODUCTS]?.can_add ?? false;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add products." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const product = await tx.products.create({
                        data: {
                            name: input.name.trim(),
                            product_type_id: input.product_type_id,
                            is_active: input.is_active ?? true,
                        },
                    });

                    await tx.products_history.create({
                        data: {
                            products_id: product.id,
                            name: product.name.trim(),
                            product_types_id: product.product_type_id,
                            is_active: product.is_active,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    return product;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateProduct: protectedProcedure.input(
            z.object({
                id: z.number(),
                name: z.string().min(1),
                product_type_id: z.number().optional(),
                is_active: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.PRODUCTS]?.can_update ?? false;

            if (!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update products." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const product = await tx.products.findUnique({
                        where: { id: input.id },
                    });

                    if(!product) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Product not found." 
                        });
                    }

                    await tx.products_history.create({
                        data: {
                            products_id: input.id,
                            name: input.name.trim(),
                            product_types_id: input.product_type_id,
                            is_active: input.is_active ?? product.is_active,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const updatedProduct = await tx.products.update({
                        where: { id: input.id },
                        data: {
                            name: input.name,
                            product_type_id: input.product_type_id,
                            is_active: input.is_active,
                        },
                    });

                    return updatedProduct;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteProduct: protectedProcedure.input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.PRODUCTS]?.can_delete ?? false;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete products." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const product = await tx.products.delete({
                        where: { id: input.id },
                    });

                    if(!product) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Product not found." 
                        });
                    }

                    await tx.products_history.create({
                        data: {
                            products_id: product.id,
                            name: product.name,
                            product_types_id: product.product_type_id,
                            is_active: product.is_active,
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

    searchProducts: protectedProcedure.input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view products." 
                });
            }

            const productsObj = await ctx.db.products.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { product_types: { name: { contains: input.query, mode: "insensitive" } } }
                    ]
                },
                take: input.limit,
                skip: input.offset,

                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    product_types: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    is_active: true,
                },
            });

            const total = await ctx.db.products.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { product_types: { name: { contains: input.query, mode: "insensitive" } } }
                    ]
                },
            });

            const products = productsObj.map(({product_types, ...rest}) => ({
                ...rest,
                product_type_id: product_types?.id,
                product_type_name: product_types?.name,
            }));

            return {products, total};
        }),

    getProductByProductTypeId: protectedProcedure.input(
            z.object({
                product_type_id: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const products = await ctx.db.products.findMany({
                where: { product_type_id: input.product_type_id },
                select: {
                    id: true,
                    name: true,
                }
            });

            return products;
        })
});