import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { CommissionDistribution, CommissionDistributionDetail, PDFHeader, PDFDetail } from './_types/commissionDestribution';

export const commissionDistributionRouter = createTRPCRouter({
    getCommissionDistribution: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<CommissionDistribution[]>`
                    WITH FILTERED AS (
                        SELECT
                            CD.ID AS id,
                            BO.ref_no AS ref_no,
                            B.buyer_name AS buyer_name,
                            CD.plan_date AS plan_date,
                            CD.approval_status AS approval_status
                        FROM commission_distributions AS CD 
                            INNER JOIN buyer_orders AS BO ON BO.id = CD.order_id
                            INNER JOIN buyers AS B ON B.ID = BO.buyer_id
                        WHERE (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = BO.TEAM_ID
                                AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                    )
                    SELECT 
                        id,
                        ref_no,
                        buyer_name,
                        plan_date,
                        approval_status,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FILTERED
                    ORDER BY plan_date DESC
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

    searchCommissionDistribution: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<CommissionDistribution[]>`
                    WITH FILTERED AS (
                        SELECT
                            CD.ID AS id,
                            BO.ref_no AS ref_no,
                            B.buyer_name AS buyer_name,
                            CD.plan_date AS plan_date,
                            CD.approval_status AS approval_status
                        FROM commission_distributions AS CD 
                            INNER JOIN buyer_orders AS BO ON BO.id = CD.order_id
                            INNER JOIN buyers AS B ON B.ID = BO.buyer_id
                            LEFT JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                            LEFT JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        WHERE (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM
                                WHERE TM.TEAM_ID = BO.TEAM_ID
                                AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            BO.ref_no ILIKE '%' || ${input.query} || '%' OR
                            B.buyer_name ILIKE '%' || ${input.query} || '%' OR
                            TO_CHAR(CD.plan_date, 'YYYY-MM-DD') ILIKE '%' || ${input.query} || '%' OR
                            OS.STYLE ILIKE '%' || ${input.query} || '%' OR
                            SD.buyer_po ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT 
                        id,
                        ref_no,
                        buyer_name,
                        plan_date,
                        approval_status,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FILTERED
                    GROUP BY id, ref_no, buyer_name, plan_date, approval_status
                    ORDER BY plan_date DESC
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

    deleteCommissionDistribution: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete commission distribution." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const isApproved = await tx.commission_distributions.findUnique({
                        where: { id: input.id },
                        select: { approval_status: true },
                    });

                    if(isApproved?.approval_status) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "Approved commission distributions cannot be deleted.",
                        });
                    }

                    const deletedDetails = await tx.commission_distributions_details.findMany({
                        where: { commission_distribution_id: input.id }
                    });

                    await ctx.db.commission_distributions_details.deleteMany({
                        where: { commission_distribution_id: input.id }
                    });

                    for( const detail of deletedDetails) {
                        await tx.commission_distribution_details_history.create({
                            data: {
                                commission_distribution_details_id: detail.id,
                                shipment_details_id: detail.shipment_details_id,
                                dhaka_commission_percentage: detail.dhaka_commission_percentage ?? 0,
                                overseas_commission_percentage: detail.overseas_commission_percentage ?? 0,
                                others_commission_percentage: detail.others_commission_percentage ?? 0,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    const deletedCommissionDistribution = await tx.commission_distributions.delete({
                        where: { id: input.id }
                    });

                    await tx.commission_distribution_history.create({
                        data: {
                            commission_distribution_id: deletedCommissionDistribution.id,
                            order_id: deletedCommissionDistribution.order_id,
                            plan_date: deletedCommissionDistribution.plan_date,
                            approval_status: deletedCommissionDistribution.approval_status,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrderIdForCommissionDistribution: protectedProcedure
        .query(async ({ ctx }) => {
            const can_add = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add commission distribution." 
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ order_id: string; ref_no: string }[]>`
                    SELECT 
                        BO.ID AS ORDER_ID,
                        REF_NO
                    FROM BUYER_ORDERS AS BO
                    INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                    WHERE (
                        EXISTS (
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = ${ctx.user.id}
                            AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                            AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM
                            WHERE TM.TEAM_ID = BO.TEAM_ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    AND BO.ID NOT IN (
                        SELECT order_id FROM commission_distributions
                    )
                    AND FO.approval_status = 2
                    AND NOT EXISTS (
                        SELECT 1
                        FROM order_styles AS OS
                        WHERE OS.order_id = BO.id
                        AND NOT EXISTS (
                            SELECT 1
                            FROM tna_plans AS TP
                            WHERE TP.style_id = OS.id
                        )
                    )
                `;

                return orders;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    addCommissionDistribution: protectedProcedure
        .input(z.object({
            order_id: z.string(),
            plan_date: z.string().optional(),
            remarks: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add commission distribution." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newDistribution = await tx.commission_distributions.create({
                        data: {
                            order_id: input.order_id,
                            plan_date: input.plan_date ? new Date(input.plan_date) : undefined,
                            remarks: input.remarks,
                        }
                    });

                    await Promise.all([
                        await tx.commission_distribution_history.create({
                            data: {
                                commission_distribution_id: newDistribution.id,
                                order_id: newDistribution.order_id,
                                plan_date: newDistribution.plan_date,
                                approval_status: newDistribution.approval_status,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            }
                        }),

                        // Generate commission distribution details per po
                        await tx.$queryRaw`
                            INSERT INTO commission_distributions_details (
                                commission_distribution_id,
                                shipment_details_id,
                                overseas_commission_percentage,
                                others_commission_percentage,
                                dhaka_commission_percentage
                            )
                            SELECT
                                CD.id,
                                SD.id,
                                COALESCE(CP.overseas_percentage, 0),
                                COALESCE(CP.other_percentage, 0),
                                CASE 
                                    WHEN (SD.fob_rate / COALESCE(NULLIF(BO.currency_rate, 0), 1)) = 0 
                                        THEN 0
                                    ELSE (
                                        (
                                            (SD.fob_rate / COALESCE(NULLIF(BO.currency_rate, 0), 1)) - FSD.factory_rate
                                        )
                                        / (SD.fob_rate / COALESCE(NULLIF(BO.currency_rate, 0), 1))
                                    ) * 100 - COALESCE(CP.overseas_percentage, 0) - COALESCE(CP.other_percentage, 0)
                                END
                            FROM commission_distributions AS CD
                                INNER JOIN buyer_orders AS BO ON CD.order_id = BO.id
                                INNER JOIN order_styles AS OS ON BO.id = OS.order_id
                                INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                LEFT JOIN commission_percentage AS CP ON CP.buyer_id = BO.buyer_id
                            WHERE CD.id = ${newDistribution.id}   
                            ON CONFLICT (shipment_details_id)
                                DO UPDATE SET dhaka_commission_percentage = EXCLUDED.dhaka_commission_percentage;
                        `,
                        
                        await tx.early_settlement.create({
                            data: {
                                order_id: input.order_id,
                            }
                        })
                    ]);


                    // Generate Early Settlement per order PO
                    await tx.$queryRaw`
                        INSERT INTO EARLY_SETTLEMENT_DETAILS (
                            SHIPMENT_DETAILS_ID,
                            EARLY_SETTLEMENT_CHARGE,
                            EARLY_SETTLEMENT_ID
                        )
                        SELECT
                            SD.id,
                            ESP.charge,
                            ES.id
                        FROM commission_distributions AS CD
                            INNER JOIN buyer_orders AS BO ON BO.id = CD.order_id
                            INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                            INNER JOIN early_settlement AS ES ON ES.order_id = BO.id
                            INNER JOIN early_settlement_percentage AS ESP ON ESP.buyer_id = BO.buyer_id
                        WHERE CD.id = ${newDistribution.id};
                    `;

                    return newDistribution;
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getCommissionDistributionById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution." 
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyer_orders: {
                            some: {
                                commission_distributions: {
                                    id: input.id
                                }
                            }
                        }
                    }
                },
            });

            if(!isATeamMember && !(ctx.user.department_id === ADMIN_DEPARTMENT_ID && ctx.user.level_id === ADMIN_LEVEL_ID)){
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this commission distribution."
                });
            } 

            try {
                const distributionObj = await ctx.db.commission_distributions.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        buyer_orders: {
                            select: {
                                id: true,
                                ref_no: true,
                            }
                        }
                    }
                });

                const details = await ctx.db.$queryRaw<CommissionDistributionDetail[]>`
                    WITH base AS (
                        SELECT
                            CDD.ID AS DB_ID,
                            OS.STYLE,
                            SD.BUYER_PO AS PO,
                            D.NAME AS DESTINATION,
                            BDS.SIZE,
                            SUM(SID.QUANTITY) AS LOT_QUANTITY,
                            SD.FOB_RATE / COALESCE(NULLIF(BO.CURRENCY_RATE, 0), 1) AS RDL_FOB,
                            FSD.FACTORY_RATE,
                            CDD.DHAKA_COMMISSION_PERCENTAGE,
                            CDD.OVERSEAS_COMMISSION_PERCENTAGE,
                            CDD.OTHERS_COMMISSION_PERCENTAGE
                        FROM commission_distributions AS CD
                        INNER JOIN commission_distributions_details AS CDD ON CDD.commission_distribution_id = CD.id
                        INNER JOIN shipment_details AS SD ON SD.id = CDD.shipment_details_id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                        INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN destinations AS D ON D.id = SD.destination_id
                        INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                        WHERE CD.id = ${input.id}
                        GROUP BY SD.BUYER_PO, 
                            CDD.ID, 
                            OS.STYLE, 
                            D.NAME, 
                            BDS.SIZE, 
                            SD.FOB_RATE, 
                            BO.CURRENCY_RATE, 
                            FSD.FACTORY_RATE
                    )
                    SELECT
                        DB_ID,
                        STYLE,
                        PO,
                        DESTINATION,
                        SIZE,
                        LOT_QUANTITY AS ORDER_QUANTITY,
                        RDL_FOB,
                        FACTORY_RATE AS FACTORY_FOB,
                        LOT_QUANTITY * RDL_FOB AS RDL_VALUE,
                        LOT_QUANTITY * FACTORY_RATE AS FACTORY_VALUE,
                        RDL_FOB - FACTORY_RATE AS MARGIN_PER_PIECE,
                        LOT_QUANTITY * (RDL_FOB - FACTORY_RATE) AS COMMISSION_VALUE,
                        CASE 
                            WHEN RDL_FOB = 0 THEN 0
                            ELSE ((RDL_FOB - FACTORY_RATE) / RDL_FOB) * 100
                        END AS COMMISSION_PERCENTAGE,
                        DHAKA_COMMISSION_PERCENTAGE,
                        OVERSEAS_COMMISSION_PERCENTAGE,
                        OTHERS_COMMISSION_PERCENTAGE
                    FROM base;
                `;

                const distribution = distributionObj ? {
                    id: distributionObj.id,
                    order_id: distributionObj.buyer_orders.id,
                    ref_no: distributionObj.buyer_orders.ref_no,
                    details: details,
                } : null;

                return distribution;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateCommissionDistribution: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                remarks: z.string().optional(),
                details: z.array(
                    z.object({
                        db_id: z.string(),
                        dhaka_commission_percentage: z.number(),
                        overseas_commission_percentage: z.number().optional(),
                        others_commission_percentage: z.number().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_edit =
                ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_update;

            if (!can_edit) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to edit commission distribution.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedDistribution =
                        await tx.commission_distributions.update({
                            where: {
                                id: input.id,
                            },
                            data: {
                                remarks: input.remarks,
                            },
                        });

                    await tx.commission_distribution_history.create({
                        data: {
                            commission_distribution_id: updatedDistribution.id,
                            order_id: updatedDistribution.order_id,
                            plan_date: updatedDistribution.plan_date,
                            approval_status: updatedDistribution.approval_status,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const details = await Promise.all(
                        input.details.map(async (detail) => { 
                            const existingDetail = await tx.commission_distributions_details.findUnique({
                                where: {
                                    id: detail.db_id,
                                },
                            });

                            if (!existingDetail) {
                                return null;
                            }

                            await tx.commission_distribution_details_history.create({
                                data: {
                                    commission_distribution_details_id: existingDetail.id,
                                    shipment_details_id: existingDetail.shipment_details_id,
                                    dhaka_commission_percentage: detail.dhaka_commission_percentage,
                                    overseas_commission_percentage: detail.overseas_commission_percentage,
                                    others_commission_percentage: detail.others_commission_percentage,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });

                            return await tx.commission_distributions_details.update({
                                where: {
                                    id: detail.db_id,
                                },
                                data: {
                                    dhaka_commission_percentage: detail.dhaka_commission_percentage,
                                    overseas_commission_percentage: detail.overseas_commission_percentage,
                                    others_commission_percentage: detail.others_commission_percentage,
                                },
                            });
                        })
                    );

                    return {
                        ...updatedDistribution,
                        details: details.filter(Boolean),
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAuthorizations: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution." 
                });
            }

            try {
                const authorizationState = await ctx.db.commission_distributions.findUnique({
                    where: { id: input.id },
                    select: {
                        approval_status: true,
                    }
                });

                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number}[]>`
                    SELECT 
                        department_id, level_id 
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.COMMISSION_DISTRIBUTION}
                        AND level_id = ${ctx.user.level_id}
                        AND department_id = ${ctx.user.department_id}
                    LIMIT 1;
                `;

                return {authorization: authorizationState, permission: authorizationPermission[0]};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    approveCommissionDistribution: protectedProcedure
        .input(z.object({
            id: z.string(),
            approval_status: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_approve = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_update;

            if(!can_approve) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve commission distribution." 
                });
            }

            try {
                const userLevel = ctx.user.level_id;
                const userDepartment = ctx.user.department_id;
                const isAdmin = userLevel === ADMIN_LEVEL_ID && userDepartment === ADMIN_DEPARTMENT_ID;

                const isCommissionDistributionAuthorized = await ctx.db.$queryRaw<{approval_status: boolean}[]>`
                    SELECT FO.approval_status = 2 AS approval_status FROM commission_distributions AS CD
                        INNER JOIN factory_orders AS FO ON FO.order_id = CD.order_id
                    WHERE CD.id = ${input.id};
                `;

                if(!isCommissionDistributionAuthorized[0]?.approval_status) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Authorize factory order first.",
                    });
                }


                const can_approve = await ctx.db.$queryRaw<{ can_approve: boolean }[]>`
                    SELECT 
                        1 as can_approve
                    FROM AUTHORIZATIONS
                    WHERE module_id = ${m.COMMISSION_DISTRIBUTION}
                        AND level_id = ${userLevel}
                        AND department_id = ${userDepartment}
                    LIMIT 1;
                `;

                if (can_approve.length === 0 && !isAdmin) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to Authorize this Commission Distribution.",
                    });
                }

                const updatedDistribution = await ctx.db.commission_distributions.update({
                    where: { id: input.id },
                    data: {
                        approval_status: input.approval_status,
                    }
                });

                await ctx.db.commission_distribution_history.create({
                    data: {
                        commission_distribution_id: updatedDistribution.id,
                        order_id: updatedDistribution.order_id,
                        plan_date: updatedDistribution.plan_date,
                        approval_status: updatedDistribution.approval_status,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    }
                });

                return updatedDistribution;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPDFData: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution." 
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyer_orders: {
                            some: {
                                commission_distributions: {
                                    id: input.id
                                }
                            }
                        }
                    }
                },
            });

            if(!isATeamMember && !(ctx.user.department_id === ADMIN_DEPARTMENT_ID && ctx.user.level_id === ADMIN_LEVEL_ID)){
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this commission distribution."
                });
            }

            try {
                const distributionObj = await ctx.db.$queryRaw<PDFHeader[]>`
                    SELECT
                        BO.ref_no AS REF_NO,
                        B.buyer_name AS BUYER_NAME,
                        BO.order_date AS ORDER_DATE
                    FROM commission_distributions AS CD
                        INNER JOIN buyer_orders AS BO ON BO.id = CD.order_id
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                    WHERE CD.id = ${input.id}
                `;

                const detailsObj = await ctx.db.$queryRaw<PDFDetail[]>`
                    WITH shipment_agg AS (
                        SELECT
                            SD.id AS shipment_detail_id,
                            OS.style,
                            SD.buyer_po,
                            SD.fob_rate / BO.currency_rate as fob_rate,
                            FSD.factory_rate,
                            SUM(SID.quantity) AS total_quantity
                        FROM shipment_details AS SD
                            JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                            JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            JOIN buyer_orders AS BO ON BO.id = OS.order_id
                            JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        GROUP BY 
                            SD.id,
                            OS.style,
                            SD.buyer_po,
                            SD.fob_rate,
                            BO.currency_rate,
                            FSD.factory_rate
                    )
                    SELECT
                        SA.style AS style,
                        SA.buyer_po AS buyer_po,
                        SA.total_quantity AS order_quantity,
                        SA.fob_rate AS rdl_fob,
                        SA.total_quantity * SA.fob_rate AS rdl_value,
                        SA.factory_rate AS factory_fob,
                        SA.total_quantity * SA.factory_rate AS factory_value,
                        (SA.fob_rate - SA.factory_rate) * 100 / NULLIF(SA.fob_rate, 0) AS commission_percentage,
                        SA.total_quantity * (SA.fob_rate - SA.factory_rate) AS commission_value,
                        COALESCE(CDD.dhaka_commission_percentage, 0) * SA.total_quantity * SA.fob_rate / 100 AS dhaka_commission,
                        COALESCE(CDD.overseas_commission_percentage, 0) * SA.total_quantity * SA.fob_rate / 100 AS overseas_commission,
                        COALESCE(CDD.others_commission_percentage, 0) * SA.total_quantity * SA.fob_rate / 100 AS others_commission
                    FROM shipment_agg AS SA
                    JOIN commission_distributions_details AS CDD ON CDD.shipment_details_id = SA.shipment_detail_id
                    JOIN commission_distributions AS CD ON CD.id = cdd.commission_distribution_id
                    where cd.id = ${input.id};
                `;

                const details = detailsObj.map(detail => ({
                    style: detail.style,
                    buyer_po: detail.buyer_po,
                    order_quantity: quantityFormatter(detail.order_quantity),
                    rdl_fob: currencyFormatter(detail.rdl_fob, '$'),
                    rdl_value: currencyFormatter(detail.rdl_value, '$'),
                    factory_fob: currencyFormatter(detail.factory_fob, '$'),
                    factory_value: currencyFormatter(detail.factory_value, '$'),
                    commission_percentage: `${quantityFormatter(detail.commission_percentage)} %`,
                    commission_value: currencyFormatter(detail.commission_value, '$'),
                    dhaka_commission: currencyFormatter(detail.dhaka_commission, '$'),
                    overseas_commission: currencyFormatter(detail.overseas_commission, '$'),
                    others_commission: currencyFormatter(detail.others_commission, '$'),
                }));

                const totalQuantity = detailsObj.reduce((sum, item) => sum + Number(item.order_quantity), 0);
                const totalValue = detailsObj.reduce((sum, item) => sum + Number(item.rdl_value), 0);
                const totalFactoryValue = detailsObj.reduce((sum, item) => sum + Number(item.factory_value), 0);
                const totalCommissionValue = detailsObj.reduce((sum, item) => sum + Number(item.commission_value), 0);
                const totalDhakaCommission = detailsObj.reduce((sum, item) => sum + Number(item.dhaka_commission), 0);
                const totalOverseasCommission = detailsObj.reduce((sum, item) => sum + Number(item.overseas_commission), 0);
                const totalOthersCommission = detailsObj.reduce((sum, item) => sum + Number(item.others_commission), 0);

                const totalCommissionPercentage = totalValue === 0 ? 0 : (totalCommissionValue / totalValue) * 100;
                const totalDhakaCommissionPercentage = totalValue === 0 ? 0 : (totalDhakaCommission / totalValue) * 100;
                const totalOverseasCommissionPercentage = totalValue === 0 ? 0 : (totalOverseasCommission / totalValue) * 100;
                const totalOthersCommissionPercentage = totalValue === 0 ? 0 : (totalOthersCommission / totalValue) * 100;

                const totalQuantityString = quantityFormatter(totalQuantity);
                const totalValueString = currencyFormatter(totalValue, '$');
                const totalFactoryValueString = currencyFormatter(totalFactoryValue, '$');
                const totalCommissionValueString = currencyFormatter(totalCommissionValue, '$');
                const totalCommissionPercentageString = `${quantityFormatter(totalCommissionPercentage)}%`;
                const totalDhakaCommissionString = `${currencyFormatter(totalDhakaCommission, '$')} (${quantityFormatter(totalDhakaCommissionPercentage)}%)`;
                const totalOverseasCommissionString = `${currencyFormatter(totalOverseasCommission, '$')} (${quantityFormatter(totalOverseasCommissionPercentage)}%)`;
                const totalOthersCommissionString = `${currencyFormatter(totalOthersCommission, '$')} (${quantityFormatter(totalOthersCommissionPercentage)}%)`;

                return {
                    header: distributionObj,
                    details: details,
                    results: {
                        totalQuantityString,
                        totalValueString,
                        totalFactoryValueString,
                        totalCommissionValueString,
                        totalCommissionPercentageString,
                        totalDhakaCommissionString,
                        totalOverseasCommissionString,
                        totalOthersCommissionString,
                    }
                }
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
        
    isFactoryOrderUnauthorized: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Commission Distributions.",
                });
            }
            
            try {
                const isFactoryOrderUnauthorized = await ctx.db.$queryRaw<{approval_status: boolean}[]>`
                    SELECT 
                        FO.approval_status <> 2 AS approval_status 
                    FROM commission_distributions AS CD
                        INNER JOIN factory_orders AS FO ON FO.order_id = CD.order_id
                    WHERE CD.id = ${input.id};
                `;

                return isFactoryOrderUnauthorized[0]?.approval_status ?? false;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    isSalesContractApproved: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMMISSION_DISTRIBUTION]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Commission Distributions.",
                });
            }
            
            try {
                const isSalesContractApproved = await ctx.db.$queryRaw<{approved: boolean}[]>`
                    SELECT 
                        sc.approval_status = 2 AS approved 
                    FROM commission_distributions AS cd
                        INNER JOIN sales_contract_details AS scd on scd.order_id = cd.order_id
                        INNER JOIN sales_contracts AS sc ON sc.id = scd.sales_contract_id
                    WHERE cd.id = ${input.id};   
                `;

                return isSalesContractApproved[0]?.approved ?? false;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

});