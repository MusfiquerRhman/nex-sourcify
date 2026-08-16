import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const productTypeRouter = createTRPCRouter({
    getProductTypes: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCT_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view product types." 
                });
            }

            const productTypes = await ctx.db.product_types.findMany({
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    is_active: true,
                },
            });

            const total = await ctx.db.product_types.count();

            return {productTypes, total};
        }),

    getProductTypeById: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCT_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view product types." 
                });
            }

            const productType = await ctx.db.product_types.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    is_active: true,
                },
            });

            return productType;
        }),

    addProductType: protectedProcedure
        .input(
            z.object({
                name: z.string().min(2),
                is_active: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.PRODUCT_TYPES]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add product types." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const productType = await tx.product_types.create({
                        data: {
                            name: input.name.trim(),
                            is_active: input.is_active,
                        },
                    });

                    await tx.product_types_history.create({
                        data: {
                            product_types_id: productType.id,   
                            name: productType.name.trim(),
                            is_active: productType.is_active,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    return productType;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateProductType: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
                name: z.string().min(2),
                is_active: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.PRODUCT_TYPES]?.can_update;

            if (!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to edit product types." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.product_types_history.create({
                        data: {
                            product_types_id: input.id,
                            name: input.name.trim(),
                            is_active: input.is_active,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const updated = await tx.product_types.update({
                        where: { id: input.id },
                        data: {
                            name: input.name.trim(),
                            is_active: input.is_active,
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

    deleteProductType: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.PRODUCT_TYPES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete product types." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const productType = await tx.product_types.delete({
                        where: { id: input.id },
                    });

                    if(!productType) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Product type not found." 
                        });
                    }

                    await tx.product_types_history.create({
                        data: {
                            product_types_id: productType.id,
                            name: productType.name,
                            is_active: productType.is_active,
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

    searchProductTypes: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.PRODUCT_TYPES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view product types." 
                });
            }

            const productTypes = await ctx.db.product_types.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { is_active: { equals: input.query.toLowerCase() === 'true' ? true : input.query.toLowerCase() === 'false' ? false : undefined } },
                    ],
                },
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    is_active: true,
                },
            });

            const total = await ctx.db.product_types.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { is_active: { equals: input.query.toLowerCase() === 'true' ? true : input.query.toLowerCase() === 'false' ? false : undefined } },
                    ],
                },
            });

            return {productTypes, total};
        }),


    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            const productTypes = await ctx.db.product_types.findMany({
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                },
                where: {
                    is_active: true,
                }
            });

            return productTypes;
        }),

});