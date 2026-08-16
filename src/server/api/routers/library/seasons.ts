import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const seasonsRouter = createTRPCRouter({
    getSeasons: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(15).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SEASON]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view seasons." 
                });
            }

            const seasonsObj = await ctx.db.seasons.findMany({
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    season_name: true,
                    buyers: {
                        select: { 
                            id: true,
                            buyer_name: true 
                        },
                    },
                    active_status: true,
                },
            });

            const total = await ctx.db.seasons.count();

            const seasons = seasonsObj.map(({buyers, ...seasons}) => ({
                ...seasons,
                buyer_id: buyers?.id,
                buyer_name: buyers?.buyer_name,
            }));

            return {seasons, total};
        }),

        getSeasonById: protectedProcedure
            .input(
                z.object({
                    id: z.number().min(1),
                })
            )
            .query(async ({ ctx, input }) => {
                const can_view = ctx.permissions[m.SEASON]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view seasons." 
                    });
                }

                const seasonObj = await ctx.db.seasons.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        season_name: true,
                        buyers: {
                            select: { 
                                id: true,
                                buyer_name: true
                            }
                        },
                        active_status: true,
                    },
                });

                const season = seasonObj ? {
                    ...seasonObj,
                    buyer_id: seasonObj.buyers?.id,
                    buyer_name: seasonObj.buyers?.buyer_name,
                } : null;

                return season;
            }),

        addSeason: protectedProcedure
            .input(
                z.object({
                    season_name: z.string().min(2),
                    buyer_id: z.number().min(1),
                    active_status: z.boolean(),
                })
            )
            .mutation(async ({ ctx, input }) => {
                const can_add = ctx.permissions[m.SEASON]?.can_add;

                if (!can_add) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to add seasons." 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        const season = await tx.seasons.create({
                            data: {
                                season_name: input.season_name.trim(),
                                buyer_id: input.buyer_id,
                                active_status: input.active_status,
                            },
                        });

                        await tx.seasons_history.create({
                            data: {
                                season_id: season.id,
                                season_name: input.season_name.trim(),
                                buyer_id: input.buyer_id,
                                active_status: input.active_status,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            },
                        });

                        return season;
                    });
                }
                catch (error) {
                    await logError(error, ctx, input);
                handlePrismaError(error);
                }
            }),

        updateSeason: protectedProcedure
            .input(
                z.object({
                    id: z.number().min(1),
                    season_name: z.string().min(2),
                    buyer_id: z.number().min(1),
                    active_status: z.boolean(),
                })
            )
            .mutation(async ({ ctx, input }) => {
                const can_update = ctx.permissions[m.SEASON]?.can_update;

                if (!can_update) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to update seasons." 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        await tx.seasons_history.create({
                            data: {
                                season_id: input.id,
                                season_name: input.season_name.trim(),
                                buyer_id: input.buyer_id,
                                active_status: input.active_status,
                                action_type: actions.UPDATE,
                                action_by: ctx.user.id,
                            },
                        });

                        const updated = await tx.seasons.update({
                            where: { id: input.id },
                            data: {
                                season_name: input.season_name.trim(),
                                buyer_id: input.buyer_id,
                                active_status: input.active_status,
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

        deleteSeason: protectedProcedure
            .input(
                z.object({
                    id: z.number().min(1),
                })
            )
            .mutation(async ({ ctx, input }) => {
                const can_delete = ctx.permissions[m.SEASON]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to delete seasons." 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        const season = await tx.seasons.delete({
                            where: { id: input.id },
                        });

                        if(!season) {
                            throw new TRPCError({ 
                                code: "NOT_FOUND", 
                                message: "Season not found." 
                            });
                        }

                        await tx.seasons_history.create({
                            data: {
                                season_id: season.id,
                                season_name: season.season_name,
                                buyer_id: season.buyer_id,
                                active_status: season.active_status,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });

                        return season;
                    });
                }
                catch (error) {
                    await logError(error, ctx, input);
                                handlePrismaError(error);
                }
            }),

    searchSeasons: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(15).optional(),
                offset: z.number().min(0).optional(),
                query: z.string().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SEASON]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view seasons." 
                });
            }

            const seasonsObj = await ctx.db.seasons.findMany({
                where: {
                    OR: [
                        { season_name: { contains: input.query, mode: "insensitive" } },
                        { buyers: { buyer_name: { contains: input.query, mode: "insensitive" } } },
                    ],
                },
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    season_name: true,
                    buyers: {
                        select: {
                            id: true,
                            buyer_name: true,
                        },
                    },
                    active_status: true,
                },
            });

            const total = await ctx.db.seasons.count({
                where: {
                    OR: [
                        { season_name: { contains: input.query, mode: "insensitive" } },
                        { buyers: { buyer_name: { contains: input.query, mode: "insensitive" } } },
                    ],
                },
            });


            const seasons = seasonsObj.map(({buyers, ...seasons}) => ({
                ...seasons,
                buyer_id: buyers?.id,
                buyer_name: buyers?.buyer_name,
            }));

            return { seasons, total };

        }),

    getSeasonsByBuyer: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const seasonsObj = await ctx.db.seasons.findMany({
                where: { buyer_id: input, active_status: true },
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    season_name: true,
                },
            });
            
            return seasonsObj;
        }),

    getSeasonsByBuyers: protectedProcedure
        .input(
            z.array(z.number().min(1))
        )
        .query(async ({ ctx, input }) => {
            const seasonsObj = await ctx.db.seasons.findMany({
                where: { buyer_id: { in: input }, active_status: true },
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    season_name: true,
                },
            });

            return seasonsObj;
        }),
});