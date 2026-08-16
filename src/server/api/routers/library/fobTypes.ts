import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { m } from "~/utils/moduleMap";
import { TRPCError } from "@trpc/server";
import { actions } from "@prisma/client";

export const fobTypesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.fob_types.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
            },
        });
    }),

    getFobTypes: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            try {
                const fobTypes = await ctx.db.fob_types.findMany({
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

                const count = await ctx.db.fob_types.count();
    
                return {
                    fobTypes,
                    count,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }

        }),

    searchFobTypes: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FOB_TYPES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view FOB Types." 
                });
            }
            
            try {
                const fobTypes = await ctx.db.fob_types.findMany({
                    where: {
                        name: {
                            contains: input.query,
                            mode: "insensitive",
                        },
                    },
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

                const count = await ctx.db.fob_types.count({
                    where: {
                        name: {
                            contains: input.query,
                            mode: "insensitive",
                        },
                    },
                });

                return {
                    fobTypes,
                    count,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }
    ),

    deleteFobType: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FOB_TYPES]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete FOB Types." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deletedFobType = await tx.fob_types.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    await tx.fob_type_history.create({
                        data: {
                            fob_type_id: deletedFobType.id,
                            name: deletedFobType.name,
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

    addFobType: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, "FOB type is required"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.FOB_TYPES]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add FOB Types." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newFobType = await tx.fob_types.create({
                        data: {
                            name: input.name.trim(),
                        },
                    });

                    await tx.fob_type_history.create({
                        data: {
                            fob_type_id: newFobType.id,
                            name: newFobType.name,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });
                    return newFobType;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateFobType: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().min(1, "FOB type is required"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.FOB_TYPES]?.can_update;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update FOB Types." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedFobType = await tx.fob_types.update({
                        where: {
                            id: input.id,
                        },
                        data: {
                            name: input.name.trim(),
                        },
                    });

                    await tx.fob_type_history.create({
                        data: {
                            fob_type_id: input.id,
                            name: input.name.trim(),
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });
                    return updatedFobType;
                });
            }   
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFobTypeById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FOB_TYPES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view FOB Types." 
                });
            }
            
            try {
                return await ctx.db.fob_types.findUnique({
                    where: {
                        id: parseInt(input.id),
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});