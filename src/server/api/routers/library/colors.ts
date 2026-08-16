import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const colorsRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const colors = await ctx.db.colors.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        })
        return colors;
    }),

    getColors: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COLORS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to view colors." 
                });
            }

            const colors = await ctx.db.colors.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { added_at: "desc" },
                take: input.limit,
                skip: input.offset,
            });

            const total = await ctx.db.colors.count();

            return { colors, total };
    }),

    getColorById: protectedProcedure
        .input(z.object({
            id: z.number(),
        })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COLORS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view colors." 
                });
            }

            const colorsObj = await ctx.db.colors.findMany({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: "asc" },
            });

            const colors = colorsObj[0];

            return colors;
    }),

    addColors: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.COLORS]?.can_add;

        if (!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add colors." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const color = await tx.colors.create({
                    data: {
                        name: input.name.trim(),
                    },
                });

                await tx.color_history.create({
                    data: {
                        color_id: color.id,
                        name: color.name.trim(),
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    },
                });

                return color;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    deleteColors: protectedProcedure
        .input(z.object({
            id: z.number(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.COLORS]?.can_delete;

        if (!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete colors." 
            });
        }

        try {
            return ctx.db.$transaction(async (tx) => {
                const color = await tx.colors.delete({
                    where: { id: input.id },
                });

                if (!color) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Color not found." 
                    });
                }

                await tx.color_history.create({
                    data: {
                        color_id: color.id,
                        name: color.name,
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


    updateColors: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().min(1),
            })
        ).mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.COLORS]?.can_update;

            if (!can_edit) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update colors." 
                });
            }

            try {
                return ctx.db.$transaction(async (tx) => {
                    await tx.color_history.create({
                        data: {
                            color_id: input.id,
                            name: input.name.trim(),
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const res = await tx.colors.update({
                        where: { id: input.id },
                        data: {
                            name: input.name.trim(),
                        },
                    });

                    return res;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
    }),

    searchColors: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).default(15),
                offset: z.number().min(0).default(0),
            })
        ).query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COLORS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view colors." 
                });
            }

            const colors = await ctx.db.colors.findMany({
                where: {
                    name: { contains: input.query, mode: "insensitive" },
                },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: "asc" },
                take: input.limit,
                skip: input.offset,
            });

            const total = await ctx.db.colors.count({
                where: {
                    name: { contains: input.query, mode: "insensitive" },
                },
            });

            return {colors, total};
    }),
});