import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma, shipment_modes } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { EarlySettlements, ShipmentDetails } from "./_types/earlySettlement";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";

export const earlySettlementRouter = createTRPCRouter({
    getEarlySettlements: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }

            const results = await ctx.db.$queryRaw<EarlySettlements[]>`
                WITH EARLY_SETTLEMENTS AS (
                    SELECT
                        ES.id,
                        BO.REF_NO,
                        B.BUYER_NAME
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
                    WHERE (
                        EXISTS ( -- Admin
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS ( -- Team Member
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM 
                                INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                            WHERE T.BUYER_ID = B.id
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    ORDER BY ES.added_at DESC
                )
                SELECT
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM EARLY_SETTLEMENTS
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => earlySettlements );

            return { earlySettlements, total };
        }),

    searchEarlySettlements: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }

            const results = await ctx.db.$queryRaw<EarlySettlements[]>`
                WITH EARLY_SETTLEMENTS AS (
                    SELECT
                        ES.id,
                        BO.REF_NO,
                        B.BUYER_NAME
                    FROM early_settlement AS ES
                        INNER JOIN buyer_orders AS BO ON BO.id = ES.order_id
                        INNER JOIN buyers AS B ON BO.buyer_id = B.id
                    WHERE (
                        EXISTS ( -- Admin
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = ${ctx.user.id}
                                AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS ( -- Team Member
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM 
                                INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                            WHERE T.BUYER_ID = B.id
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    AND (
                        BO.REF_NO ILIKE '%' || ${input.query} || '%'
                        OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                    )
                    ORDER BY ES.added_at DESC
                )
                SELECT
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM EARLY_SETTLEMENTS
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
            const earlySettlements = results.map(({total_count: _, ...earlySettlements}) => earlySettlements );

            return { earlySettlements, total };
        }),

    deleteEarlySettlement: protectedProcedure
        .input(z.object({
            id: z.string().min(1, 'Id is mandatory')
        }))
        .mutation(async ({ctx, input}) => {
            const can_delete = ctx.permissions[m.EARLY_SETTLEMENT]?.can_delete;

            if(!can_delete){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to delete early settlement"
                })
            }
            
            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const earlySettlementDetails = await tx.early_settlement_details.findMany({
                        where: {
                            early_settlement_id: input.id
                        }
                    })

                    await Promise.all([
                        await tx.early_settlement_details.deleteMany({
                            where: {
                                early_settlement_id: input.id
                            }
                        }),
                        
                        await tx.early_settlement.delete({
                            where: {
                                id: input.id
                            }
                        }),
                        
                        await tx.early_settlement_details_history.createMany({
                            data: earlySettlementDetails.map((settlements) => ({
                                early_settlement_details_id: settlements.id,
                                shipment_details_id: settlements.early_settlement_id,
                                early_settlement_charge: settlements.early_settlement_charge,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }))
                        })
                    ]);
                })
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPoDetails: protectedProcedure
        .input(z.object({
            id: z.string().min(1, 'Id is required')
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlements"
                })
            }

            try {
                const shipmentsObj = await ctx.db.$queryRaw<ShipmentDetails[]>`
                    WITH shipment_agg AS (
                        SELECT
                            SD.id AS shipment_detail_id,
                            OS.style,
                            SD.buyer_po,
                            SD.fob_rate / BO.currency_rate as fob_rate,
                            FSD.factory_rate,
                            SUM(SID.quantity) AS order_quantity,
                            COALESCE(ESD.early_settlement_charge, 0) AS early_settlement_charge,
                            (SD.fob_rate / COALESCE(BO.currency_rate, 1)) * (1 - COALESCE(ESD.early_settlement_charge, 0) / 100) AS effective_fob,
                            D.name AS destination,
                            BDS.size,
                            C.symbol
                        FROM shipment_details AS SD
                            INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                            INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            LEFT JOIN early_settlement_details AS ESD ON ESD.shipment_details_id = SD.id
                            INNER JOIN destinations AS D ON D.id = SD.destination_id
                            INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                            LEFT JOIN currencies AS C ON C.id = BO.secondary_currency_id
                        GROUP BY SD.id, OS.style, SD.buyer_po, SD.fob_rate, BO.currency_rate, FSD.factory_rate, ESD.id, D.id, BDS.id, C.id
                    ),
                    CALC AS (
                        SELECT
                            *,
                            SA.order_quantity * SA.fob_rate AS rdl_value,
                            SA.order_quantity * SA.effective_fob AS effective_rdl_value,
                            SA.order_quantity * SA.factory_rate AS factory_value,
                            (SA.fob_rate - SA.factory_rate) * 100 / NULLIF(SA.fob_rate, 0) AS commission_percentage,
                            (SA.effective_fob - SA.factory_rate) * 100 / SA.effective_fob AS effective_commission_percentage,
                            SA.order_quantity * (SA.fob_rate - SA.factory_rate) AS commission_value,
                            (SA.order_quantity * SA.effective_fob) - (SA.order_quantity * SA.factory_rate) AS effective_commission
                        FROM shipment_agg AS SA
                    ),
                    DISTRIBUTIONS AS (
                        SELECT
                            CDD.shipment_details_id,
                            COALESCE(CDD.dhaka_commission_percentage, 0) AS dhaka_commission,
                            COALESCE(CDD.overseas_commission_percentage, 0) AS overseas_commission,
                            COALESCE(CDD.others_commission_percentage, 0) AS others_commission,
                            COALESCE(CDD.overseas_commission_percentage, 0) + COALESCE(CDD.others_commission_percentage, 0) AS mandatory_commission
                        FROM commission_distributions_details AS CDD
                    )
                    SELECT
                        ESD.id,
                        C.style AS style, 
                        C.buyer_po AS buyer_po, 
                        C.destination, 
                        C.size,
                        C.order_quantity AS order_quantity,
                        C.fob_rate,
                        C.rdl_value,
                        C.early_settlement_charge,
                        C.effective_fob AS effective_rdl_fob, 
                        C.effective_rdl_value,
                        C.factory_rate, 
                        C.factory_value,
                        C.commission_percentage,
                        C.effective_commission_percentage,
                        C.commission_value,
                        C.effective_commission,
                        COALESCE(D.dhaka_commission, 0) AS dhaka_commission_percentage,
                        (C.effective_commission_percentage - COALESCE(D.mandatory_commission, 0)) AS effective_dhaka_commission_percentage,
                        C.order_quantity * C.fob_rate * COALESCE(D.dhaka_commission, 0) / 100 AS dhaka_value,
                        C.order_quantity * C.effective_fob * (C.effective_commission_percentage - COALESCE(D.mandatory_commission, 0)) / 100 AS effective_dhaka_value,
                        COALESCE(D.overseas_commission, 0) AS overseas_commission_percentage,
                        C.order_quantity * C.fob_rate * COALESCE(D.overseas_commission, 0) / 100 AS overseas_value,
                        C.order_quantity * C.effective_fob * COALESCE(D.overseas_commission, 0) / 100 AS effective_overseas_value,
                        COALESCE(D.others_commission, 0) AS other_commission_percentage,
                        C.order_quantity * C.fob_rate * COALESCE(D.others_commission, 0) / 100 AS other_value,
                        C.order_quantity * C.effective_fob * COALESCE(D.others_commission, 0) / 100 AS effective_other_value,
                        C.symbol
                    FROM CALC AS C
                                LEFT JOIN DISTRIBUTIONS AS D ON D.shipment_details_id = C.shipment_detail_id
                    JOIN early_settlement_details AS ESD ON ESD.shipment_details_id = C.shipment_detail_id
                    where ESD.early_settlement_id = ${input.id};
                `;

                const shipments = shipmentsObj.map((item) => ({
                    ...item,
                    order_quantity: quantityFormatter(item.order_quantity),
                    fob_rate: currencyFormatter(item.fob_rate, item.symbol ?? '$'),
                    rdl_value: currencyFormatter(item.rdl_value, item.symbol ?? '$'),
                    early_settlement_charge: item.early_settlement_charge,
                    effective_rdl_fob: currencyFormatter(item.effective_rdl_fob, item.symbol ?? '$'),
                    effective_rdl_value: currencyFormatter(item.effective_rdl_value, item.symbol ?? '$'),
                    factory_rate: currencyFormatter(item.factory_rate, item.symbol ?? '$'),
                    factory_value: currencyFormatter(item.factory_value, item.symbol ?? '$'),
                    commission_percentage: `${quantityFormatter(item.commission_percentage)} %`,
                    effective_commission_percentage: `${quantityFormatter(item.effective_commission_percentage)} %`,
                    commission_value: currencyFormatter(item.commission_value, item.symbol ?? '$'),
                    effective_commission: currencyFormatter(item.effective_commission, item.symbol ?? '$'),
                    dhaka_commission_percentage: `${quantityFormatter(item.dhaka_commission_percentage)} %`,
                    effective_dhaka_commission_percentage: `${quantityFormatter(item.effective_dhaka_commission_percentage)} %`,
                    dhaka_value: currencyFormatter(item.dhaka_value, item.symbol ?? '$'),
                    effective_dhaka_value: currencyFormatter(item.effective_dhaka_value, item.symbol ?? '$'),
                    overseas_commission_percentage: `${quantityFormatter(item.overseas_commission_percentage)} %`,
                    overseas_value: currencyFormatter(item.overseas_value, item.symbol ?? '$'),
                    effective_overseas_value: currencyFormatter(item.effective_overseas_value, item.symbol ?? '$'),
                    other_commission_percentage: `${quantityFormatter(item.other_commission_percentage)} %`,
                    other_value: currencyFormatter(item.other_value, item.symbol ?? '$'),
                    effective_other_value: currencyFormatter(item.effective_other_value, item.symbol ?? '$'),
                }));

                const totals = {
                    order_quantity: quantityFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.order_quantity), 0
                        )
                    ),
                    rdl_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.rdl_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    effective_rdl_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.effective_rdl_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    factory_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.factory_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    commission_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.commission_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    effective_commission: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.effective_commission), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    dhaka_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.dhaka_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    effective_dhaka_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.effective_dhaka_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    overseas_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.overseas_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    effective_overseas_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.effective_overseas_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    other_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.other_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                    effective_other_value: currencyFormatter(
                        shipmentsObj.reduce(
                            (sum, item) => sum = sum + safeNumber(item.effective_other_value), 0
                        ), shipmentsObj[0]?.symbol ?? '$'
                    ),
                }
                return {shipments, totals};
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addEarlySettlement: protectedProcedure
        .input(z.object({
            order_id: z.string().min(1, 'Order is Mandatory'),
            remarks: z.string().optional(),
            buyer_id: z.number(),
        }))
        .mutation(async({ctx, input}) => {
            const can_add = ctx.permissions[m.EARLY_SETTLEMENT]?.can_add;

            if(!can_add){
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't have permission to add Early Settlement"
                })
            }
            
            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const newEarlySettlement = await tx.early_settlement.create({
                        data: {
                            order_id: input.order_id,
                            buyer_id: input.buyer_id,
                            remarks: input.remarks
                        }
                    })

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
                        FROM buyer_orders AS BO
                            INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                            INNER JOIN early_settlement AS ES ON ES.order_id = BO.id
                            INNER JOIN early_settlement_percentage AS ESP ON ESP.buyer_id = BO.buyer_id
                        WHERE ES.id = ${newEarlySettlement.id};
                    `;

                    return newEarlySettlement.id;
                })

            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

        
    getOrderForEarlySettlement: protectedProcedure
        .input(z.object({
            buyer_id: z.number().min(1, 'Select Buyer'),
            early_settlement_id: z.string().optional()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_add;
            
            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlement"
                })
            }
            
            const whereClause = input.early_settlement_id 
                ? Prisma.sql`WHERE ID <> ${input.early_settlement_id}`
                : Prisma.empty;


            const buyer_orders = await ctx.db.$queryRaw<{id: string; ref_no: string}[]>`
                SELECT  
                    ID,
                    REF_NO
                FROM buyer_orders AS BO WHERE ID NOT IN (
                    SELECT ORDER_ID FROM early_settlement
                    ${whereClause}
                    ORDER BY ADDED_AT DESC
                )
                AND BO.BUYER_ID = ${input.buyer_id};
            `;

            return buyer_orders;
        }),
    
    getBuyersForEarlySettlement: protectedProcedure
        .query(async ({ctx}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_add;
            
            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlement"
                })
            }

            const buyers = await ctx.db.$queryRaw<{id: number, buyer_name: string}[]>`
                SELECT
                    DISTINCT B.ID, B.BUYER_NAME
                FROM early_settlement_percentage AS ESP
                    INNER JOIN BUYERS AS B ON ESP.buyer_id = B.id
                    INNER JOIN TEAMS AS T ON T.buyer_id = B.id
                WHERE (
                    EXISTS (
                        SELECT 1
                        FROM USERS U
                        WHERE U.ID = ${ctx.user.id}
                        AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                        AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM TEAM_MEMBERS TM
                        WHERE TM.TEAM_ID = T.ID
                        AND TM.USER_ID = ${ctx.user.id}
                    )
                )
                GROUP BY B.ID
                ORDER BY B.BUYER_NAME ASC;
            `;

            return buyers;
        }),


    getEarlySettlementById: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.EARLY_SETTLEMENT]?.can_view;

            if(!can_view){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to view Early Settlement"
                })
            }

            try {
                const earlySettlement = await ctx.db.early_settlement.findUnique({
                    where: {
                        id: input.id
                    },
                    select: {
                        id: true,
                        order_id: true,
                        buyer_id: true,
                        remarks: true
                    }
                });

                return earlySettlement;
            }
            catch(error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateEarlySettlement: protectedProcedure
        .input(z.object({
            id: z.string(),
            remarks: z.string().optional(),
            pos: z.array(z.object({
                id: z.string(),
                percentage: z.number()
            }))
        }))
        .mutation(async ({ctx, input}) => {
            const can_update = ctx.permissions[m.EARLY_SETTLEMENT]?.can_update;

            if(!can_update){
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You don't have permission to update early settlement"
                })
            }

            return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                const existingDetails = await tx.early_settlement_details.findMany({
                    where: {
                        early_settlement_id: input.id
                    }
                })

                try {
                    await Promise.all([
                        await tx.early_settlement.update({
                            where: {
                                id: input.id
                            },
                            data: {
                                remarks: input.remarks
                            }
                        }),

                        input.pos.map(async (item) => {
                            await tx.early_settlement_details.update({
                                where: {
                                    id: item.id
                                },
                                data: {
                                    early_settlement_charge: item.percentage
                                }
                            })
                        }),

                        await tx.early_settlement_details_history.createMany({
                            data: existingDetails.map((item) => ({
                                early_settlement_details_id: item.id,
                                early_settlement_charge: item.early_settlement_charge,
                                shipment_details_id: item.shipment_details_id,
                                action_by: ctx.user.id,
                                action_type: actions.UPDATE
                            }))
                        })
                        
                    ])
                }
                catch (error){
                    await logError(error, ctx, input);
                    handlePrismaError(error);
                }
            })
        })

});
