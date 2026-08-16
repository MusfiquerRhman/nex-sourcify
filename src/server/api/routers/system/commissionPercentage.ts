import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

interface Distribution {
    id: number;
    buyer_name: string;
    other_percentage: number;
    overseas_percentage: number;
    total_count: bigint;
}

export const commissionPercentageRouter = createTRPCRouter({
    getCommissions: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        ).query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Commission Distribution Percentages." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<Distribution[]>`
                    WITH COMMISSIONS AS (
                        SELECT 
                            CP.id,
                            B.buyer_name,
                            CP.other_percentage,
                            CP.overseas_percentage,
                            CP.ADDED_AT
                        FROM COMMISSION_PERCENTAGE AS CP
                            INNER JOIN buyers AS B ON B.id = CP.buyer_id
                        ORDER BY CP.ADDED_AT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMISSIONS 
                    LIMIT ${input.limit ?? 10}
                    OFFSET ${input.offset ?? 0};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const distributions = result.map(({ total_count: _, ...row }) => row);
    
                return { distributions, total: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchCommissions: protectedProcedure
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
                const result = await ctx.db.$queryRaw<Distribution[]>`
                    WITH COMMISSIONS AS (
                        SELECT 
                            CP.id,
                            B.buyer_name,
                            CP.other_percentage,
                            CP.overseas_percentage,
                            CP.ADDED_AT
                        FROM COMMISSION_PERCENTAGE AS CP
                            INNER JOIN buyers AS B ON B.id = CP.buyer_id
                        WHERE B.buyer_name ILIKE '%' || ${input.query} || '%'
                        ORDER BY CP.ADDED_AT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMISSIONS 
                    LIMIT ${input.limit ?? 10}
                    OFFSET ${input.offset ?? 0};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const distributions = result.map(({ total_count: _, ...row }) => row);
    
                return { distributions, total: total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteCommission: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ctx, input}) => {
            const can_delete = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Commission Distribution Percentages." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const deleteCommission = await tx.commission_percentage.delete({
                        where: {id: input.id}
                    });

                    await tx.commission_percentage_history.create({
                        data: {
                            commission_percentage: deleteCommission.id,
                            buyer_id: deleteCommission.buyer_id,
                            other_percentage: deleteCommission.other_percentage,
                            overseas_percentage: deleteCommission.overseas_percentage,
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


    addCommission: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            other_percentage: z.number().optional(),
            overseas_percentage: z.number().optional(),
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add commission distribution." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newCommission = await tx.commission_percentage.create({
                        data: {
                            buyer_id: input.buyer_id,
                            other_percentage: input.other_percentage,
                            overseas_percentage: input.overseas_percentage
                        }
                    });

                    await tx.commission_percentage_history.create({
                        data: {
                            commission_percentage: newCommission.id,
                            buyer_id: input.buyer_id,
                            other_percentage: input.other_percentage,
                            overseas_percentage: input.overseas_percentage,
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

    getCommissionById: protectedProcedure
        .input(z.object({
            id: z.number()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view commission distribution"
                })
            }

            try {
                const commissionsObj = await ctx.db.commission_percentage.findUnique({
                    where: {id: input.id},
                    select: {
                        id: true,
                        buyers: {
                            select: {
                                id: true,
                                buyer_name: true
                            }
                        },
                        overseas_percentage: true,
                        other_percentage: true
                    }
                })

                const commissions = commissionsObj ? {
                    id: commissionsObj.id,
                    buyer_id: commissionsObj.buyers?.id,
                    buyer_name: commissionsObj.buyers?.buyer_name,
                    overseas_percentage: commissionsObj.overseas_percentage,
                    other_percentage: commissionsObj.other_percentage
                } : null;

                return commissions;
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateCommissions: protectedProcedure
        .input(z.object({
            db_id: z.number(),
            other_percentage: z.number().optional(),
            overseas_percentage: z.number().optional()
        }))
        .mutation(async ({ctx, input}) => {
            const can_update = ctx.permissions[m.LIBRARY_COMMISSION_DISTRIBUTION]?.can_update;

            if(!can_update){
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't permission to update commission percentages"
                })
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedCommission = await tx.commission_percentage.update({
                        where: {id: input.db_id},
                        data: {
                            other_percentage: input.other_percentage,
                            overseas_percentage: input.overseas_percentage
                        }
                    });

                    await tx.commission_percentage_history.create({
                        data: {
                            commission_percentage: input.db_id,
                            buyer_id: updatedCommission.buyer_id,
                            other_percentage: input.other_percentage,
                            overseas_percentage: input.overseas_percentage,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE
                        }
                    })
                })
            }
            catch(error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBuyerForCommissionPercentage: protectedProcedure
        .query(async ({ctx}) => {
            return await ctx.db.$queryRaw<{id: number, buyer_name: string}[]>`
                SELECT
                    ID,
                    BUYER_NAME
                FROM BUYERS AS B 
                WHERE B.ID NOT IN (
                    SELECT BUYER_ID FROM COMMISSION_PERCENTAGE
                );
            `;
        })
})