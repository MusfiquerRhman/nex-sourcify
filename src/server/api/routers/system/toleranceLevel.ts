import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

interface ToleranceLevel {
    id: number;
    buyer_name: string;
    tolerance_percentage: number;
    total_count: bigint;
}

export const toleranceLevelRouter = createTRPCRouter({
    getToleranceByBuyer: protectedProcedure
        .input(z.object({ buyerID: z.number() }))
        .query(async ({ ctx, input }) => {
            const tolerance = await ctx.db.shipment_tolerance_level.findUnique({
                where: { buyer_id: input.buyerID },
                select: {
                    tolerance_level: true,
                },
            });

            return tolerance?.tolerance_level ?? 10; // Default to 10% if not set
        }),

    getTolerance: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),  
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const rows = await ctx.db.$queryRaw<ToleranceLevel[]>`
                SELECT
                    STL.id,
                    B.buyer_name AS BUYER_NAME,
                    STL.TOLERANCE_LEVEL AS TOLERANCE_PERCENTAGE,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM shipment_tolerance_level AS STL
                INNER JOIN BUYERS AS B ON STL.buyer_id = B.id
                ORDER BY STL.ADDED_AT DESC
                LIMIT ${input.limit} 
                OFFSET ${input.offset};
            `;
            
            const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

            const toleranceLevels = rows.map(({ total_count: _, ...rest }) => rest);

            return { toleranceLevels, total: totalCount };
        }),

    searchTolerance: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),  
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const rows = await ctx.db.$queryRaw<ToleranceLevel[]>`
                SELECT
                    STL.id,
                    B.buyer_name AS BUYER_NAME,
                    STL.TOLERANCE_LEVEL AS TOLERANCE_PERCENTAGE,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM shipment_tolerance_level AS STL
                INNER JOIN BUYERS AS B ON STL.buyer_id = B.id
                WHERE B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                ORDER BY STL.ADDED_AT DESC
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

            const toleranceLevels = rows.map(({ total_count: _, ...rest }) => rest);

            return { toleranceLevels, total: totalCount };
        }),

    getToleranceByID: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const tolerance = await ctx.db.shipment_tolerance_level.findUnique({
                where: { id: input.id },
                select: {
                    buyer_id: true,
                    tolerance_level: true,
                },
            });

            return tolerance;
        }),

    addTolerance: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            tolerance_level: z.number().min(0).max(100),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add this resource.",
                });
            }

            try {
                return ctx.db.$transaction(async (tx) => {
                    await tx.shipment_tolerance_level.create({
                        data: {
                            buyer_id: input.buyer_id,
                            tolerance_level: input.tolerance_level,
                        },
                    });

                    await tx.shipment_tolerance_level_history.create({
                        data: {
                            buyer_id: input.buyer_id,
                            tolerance_level: input.tolerance_level,
                            users: {
                                connect: { id: ctx.user.id },
                            },
                            action_type: 'ADDED',
                        },
                    });
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateTolerance: protectedProcedure
        .input(z.object({
            id: z.number(),
            tolerance_level: z.number().min(0).max(100),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update this resource.",
                });
            }

            try {
                return ctx.db.$transaction(async (tx) => {
                    await tx.shipment_tolerance_level.update({
                        where: { id: input.id },
                        data: {
                            tolerance_level: input.tolerance_level,
                        },
                    });

                    await tx.shipment_tolerance_level_history.create({
                        data: {
                            tolerance_level: input.tolerance_level,
                            users: {
                                connect: { id: ctx.user.id },
                            },
                            action_type: 'UPDATE',
                        },
                    });
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTolerance: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SHIPMENT_TOLERANCE]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete this resource.",
                });
            }

            try {
                return ctx.db.$transaction(async (tx) => {
                    const deletedTolerance = await tx.shipment_tolerance_level.delete({
                        where: { id: input.id },
                    });

                    await tx.shipment_tolerance_level_history.create({
                        data: {
                            tolerance_level: deletedTolerance.tolerance_level,
                            buyer_id: deletedTolerance.buyer_id,
                            users: {
                                connect: { id: ctx.user.id },
                            },
                            action_type: 'DELETE',
                        },
                    });
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});
