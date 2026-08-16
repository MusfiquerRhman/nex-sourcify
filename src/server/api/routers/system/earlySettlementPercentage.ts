import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

interface EarlySettlement {
    id: number;
    buyer_name: string;
    CHARGE: number;
    total_count: bigint;
}

export const earlySettlementPercentageRoute = createTRPCRouter({
    getEarlySettlementPercentage: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        ).query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT_PERCENTAGE]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Early Settlement percentage." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<EarlySettlement[]>`
                    WITH PERCENTAGE AS (
                        SELECT 
                            ESP.id,
                            B.buyer_name,
                            ESP.charge,
                            ESP.ADDED_AT
                        FROM early_settlement_percentage AS ESP
                            INNER JOIN buyers AS B ON B.id = ESP.buyer_id
                        ORDER BY ESP.ADDED_AT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PERCENTAGE 
                    LIMIT ${input.limit ?? 10}
                    OFFSET ${input.offset ?? 0};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const charges = result.map(({ total_count: _, ...row }) => row);
    
                return { charges, total: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchEarlySettlementPercentages: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Commission Distribution Percentages." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<EarlySettlement[]>`
                    WITH PERCENTAGE AS (
                        SELECT 
                            ESP.id,
                            B.buyer_name,
                            ESP.charge,
                            ESP.ADDED_AT
                        FROM early_settlement_percentage AS ESP
                            INNER JOIN buyers AS B ON B.id = ESP.buyer_id
                        WHERE B.buyer_name ILIKE '%' || ${input.query} || '%'
                        ORDER BY ESP.ADDED_AT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PERCENTAGE 
                    LIMIT ${input.limit ?? 10}
                    OFFSET ${input.offset ?? 0};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const charges = result.map(({ total_count: _, ...row }) => row);
    
                return { charges, total: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteEarlySettlement: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ctx, input}) => {
            const can_delete = ctx.permissions[m.EARLY_SETTLEMENT_PERCENTAGE]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Early Settlement Percentages." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deletedSettlement = await tx.early_settlement_percentage.delete({
                        where: {id: input.id}
                    });

                    await tx.early_settlement_percentage_history.create({
                        data: {
                            buyer_id: deletedSettlement.buyer_id,
                            early_settlement_percentage_id: deletedSettlement.id,
                            charge: deletedSettlement.charge,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                        }
                    })
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addEarlySettlementPercentage: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            charge: z.number(),
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.EARLY_SETTLEMENT_PERCENTAGE]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add Early Settlement." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newCommission = await tx.early_settlement_percentage.create({
                        data: {
                            buyer_id: input.buyer_id,
                            charge: input.charge,
                        }
                    });

                    await tx.early_settlement_percentage_history.create({
                        data: {
                            early_settlement_percentage_id: newCommission.id,
                            buyer_id: input.buyer_id,
                            charge: input.charge,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED
                        }
                    })
                    
                    return newCommission.id;
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getEarlySettlementPercentageById: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Commission Distribution Percentages." 
                });
            }

            try {
                const earlySettlementPercentageObj = await ctx.db.early_settlement_percentage.findUnique({
                    where: {id: input.id},
                    select: {
                        id: true,
                        buyers: {
                            select: {
                                id: true,
                                buyer_name: true,
                            }
                        },
                        charge: true,
                    }
                });

                const charges = earlySettlementPercentageObj ? {
                    id: earlySettlementPercentageObj.id,
                    buyer_id: earlySettlementPercentageObj.buyers.id,
                    buyer_name: earlySettlementPercentageObj.buyers.buyer_name,
                    charge: earlySettlementPercentageObj.charge
                } : null;

                return charges; 
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateEarlySettlementPercentage: protectedProcedure
        .input(z.object({
            db_id: z.string(),
            charge: z.number().optional(),
        }))
        .mutation(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_update;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update Commission Distribution Percentages." 
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedEarlySettlementCharge = await tx.early_settlement_percentage.update({
                        where: {id: input.db_id},
                        data: {
                            charge: input.charge
                        }
                    });

                    await tx.early_settlement_percentage_history.create({
                        data: {
                            early_settlement_percentage_id: input.db_id,
                            buyer_id: updatedEarlySettlementCharge.buyer_id,
                            charge: input.charge,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE
                        }
                    })
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBuyersForEarlySettlementPercentage: protectedProcedure
        .query(async ({ctx}) => {
            return await ctx.db.$queryRaw<{id: number, buyer_name: string}[]>`
                SELECT
                    ID,
                    BUYER_NAME
                FROM BUYERS AS B 
                WHERE B.ID NOT IN (
                    SELECT BUYER_ID FROM early_settlement_percentage
                );
            `;
        })
})