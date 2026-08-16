import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { currencyFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { LcResponse, LcDetailsResponse } from './_types/lcMaster';

export const lcMasterRouter = createTRPCRouter({
    getLc: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC."
                });
            }

            try {
                const result = await ctx.db.$queryRaw<LcResponse[]>`
                    WITH LC AS (
                        SELECT 
                            LC.ID AS ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            LC.LC_NO AS LC_NO,
                            LC.LC_OPEN_DATE AS LC_OPEN_DATE,
                            LC.LC_RECEIVED_DATE AS LC_RECEIVED_DATE,
                            SUM(ST.RDL_VALUE) AS LC_VALUE,
                            LC.IS_AUTHORIZED AS STATUS,
                            COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
                            LCAMD.AMENDMENT_NO AS AMENDMENT_NO,
                            LC.ADDED_AT
                        FROM LC_MASTER AS LC
                            LEFT JOIN lc_orders AS LCD ON LCD.lc_master_id = LC.id
                            LEFT JOIN buyer_orders AS BO ON BO.id = LCD.order_id
                            LEFT JOIN currencies AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.ID = LC.BUYER_ID
                            LEFT JOIN LC_AMENDMENT_METADATA AS LCAMD ON LCAMD.lc_id = LC.id
                            LEFT JOIN (
                                SELECT 
                                    LCS.lc_order_id AS lc_order_id,
                                    SUM(SID.QUANTITY) * SD.FOB_RATE AS RDL_VALUE
                                FROM order_styles AS OS 
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                    LEFT JOIN lc_shipments AS LCS ON LCS.shipment_details_id = SD.id
                                GROUP BY LCS.lc_order_id, SD.FOB_RATE
                            ) ST ON ST.lc_order_id = LCD.id
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
                                WHERE T.BUYER_ID = LC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY LC.ID, LC.ADDED_AT, B.BUYER_NAME, C.symbol, LCAMD.AMENDMENT_NO
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM LC
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset}
                ;`

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const lc = result.map(({total_count: _, ...lc}) => {
                    return {
                        ...lc,
                        lc_value: currencyFormatter(Number(lc.lc_value), lc.currency_symbol),
                    }
                });

                return { lc, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchLc: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC."
                });
            }

            try {
                const result = await ctx.db.$queryRaw<LcResponse[]>`
                    WITH LC AS (
                        SELECT 
                            LC.ID AS ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            LC.LC_NO AS LC_NO,
                            LC.LC_OPEN_DATE AS LC_OPEN_DATE,
                            LC.LC_RECEIVED_DATE AS LC_RECEIVED_DATE,
                            SUM(ST.RDL_VALUE) AS LC_VALUE,
                            LC.IS_AUTHORIZED AS STATUS,
                            COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
                            LCAMD.AMENDMENT_NO AS AMENDMENT_NO,
                            LC.ADDED_AT
                        FROM LC_MASTER AS LC
                            LEFT JOIN lc_orders AS LCD ON LCD.lc_master_id = LC.id
                            LEFT JOIN buyer_orders AS BO ON BO.id = LCD.order_id
                            LEFT JOIN currencies AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.ID = LC.BUYER_ID
                            LEFT JOIN LC_AMENDMENT_METADATA AS LCAMD ON LCAMD.lc_id = LC.id
                            LEFT JOIN (
                                SELECT 
                                    OS.order_id AS ORDER_ID,
                                    SUM(SID.QUANTITY) * SD.FOB_RATE AS RDL_VALUE
                                FROM order_styles AS OS 
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                GROUP BY SD.id, OS.order_id, SD.FOB_RATE
                            ) ST ON ST.ORDER_ID = LCD.order_id
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
                                WHERE T.BUYER_ID = LC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            LC.LC_NO ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM lc_orders AS LCD2
                                    LEFT JOIN order_styles AS OS ON OS.order_id = LCD2.order_id
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN buyer_orders AS BO ON BO.ID = LCD.order_id 
                                WHERE LCD2.lc_master_id = LC.id
                                    AND (
                                        OS.style ILIKE '%' || ${input.query} || '%'
                                        OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                                        OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                                    )
                            )
                        )
                        GROUP BY LC.ID, LC.ADDED_AT, C.symbol, B.BUYER_NAME, LCAMD.AMENDMENT_NO
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM LC
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset}
                ;`

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const lc = result.map(({total_count: _, ...lc}) => {
                    return {
                        ...lc,
                        lc_value: currencyFormatter(Number(lc.lc_value), lc.currency_symbol),
                    }
                });

                return { lc, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteLc: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.LC_MASTER]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete this LC."
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    await tx.lc_amendment_metadata.deleteMany({
                        where: { lc_id: input.id }
                    });

                    const lcShipmentDetails = await tx.lc_shipments.findMany({
                        where: {
                            lc_orders: {
                                lc_master_id: input.id,
                            }
                        }
                    });

                    for (const shipment of lcShipmentDetails) {
                        await tx.lc_shipments_history.create({
                            data: {
                                lc_shipments_id: shipment.id,
                                lc_order_id: shipment.lc_order_id,
                                shipment_details_id: shipment.shipment_details_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    await tx.lc_shipments.deleteMany({
                        where: {
                            lc_orders: {
                                lc_master_id: input.id
                            }
                        }
                    });

                    const lcOrders = await tx.lc_orders.findMany({
                        where: {
                            lc_master_id: input.id,
                        }
                    });

                    for (const order of lcOrders) {
                        await tx.lc_orders_history.create({
                            data: {
                                lc_master_id: input.id,
                                lc_orders_id: order.id,
                                order_id: order.order_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    await tx.lc_orders.deleteMany({
                        where: {
                            lc_master_id: input.id,
                        }
                    });

                    const deletedLC = await tx.lc_master.delete({
                        where: {
                            id: input.id,
                        }
                    })

                    await tx.lc_master_history.create({
                        data: {
                            lc_master_id: deletedLC.id,
                            lc_no: deletedLC.lc_no,
                            lc_open_date: deletedLC.lc_open_date,
                            quantity: deletedLC.quantity,
                            lc_value: deletedLC.lc_value,
                            buyer_bank_id: deletedLC.buyer_bank_id,
                            lc_received_date: deletedLC.lc_received_date,
                            lc_expire_date: deletedLC.lc_expire_date,
                            latest_shipment_date: deletedLC.latest_shipment_date,
                            rdl_bank_id: deletedLC.rdl_bank_id,
                            remarks: deletedLC.remarks,
                            status: deletedLC.status,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    })
                }, {timeout: 30000});

            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    createLc: protectedProcedure
        .input(
            z.object({
                buyer_id: z.number(),
                lc_no: z.string(),
                lc_quantity: z.number(),
                lc_value: z.number(),
                lc_open_date: z.date(),
                lc_received_date: z.date(),
                lc_expire_date: z.date().optional(),
                latest_shipment_date: z.date().optional(),
                company_id: z.number(),
                currency_id: z.number(),
                rdl_bank_id: z.number(),
                buyer_bank_id: z.number(),
                status: z.boolean(),
                remarks: z.string().optional(),
                orders: z.array(z.object({
                    order_id: z.string(),
                    pi_no: z.string().optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.LC_MASTER]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to create a new LC.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newLC = await tx.lc_master.create({
                        data: {
                            buyer_id: input.buyer_id,
                            lc_no: input.lc_no,
                            quantity: input.lc_quantity,
                            lc_value: input.lc_value,
                            lc_open_date: input.lc_open_date,
                            lc_received_date: input.lc_received_date,
                            lc_expire_date: input.lc_expire_date,
                            latest_shipment_date: input.latest_shipment_date,
                            currency_id: input.currency_id,
                            rdl_bank_id: input.rdl_bank_id,
                            buyer_bank_id: input.buyer_bank_id,
                            status: input.status,
                            remarks: input.remarks,
                            company_id: input.company_id,
                        },
                    });

                    await tx.lc_master_history.create({
                        data: {
                            lc_master_id: newLC.id,
                            lc_no: newLC.lc_no,
                            lc_open_date: newLC.lc_open_date,
                            quantity: newLC.quantity,
                            lc_value: newLC.lc_value,
                            buyer_bank_id: newLC.buyer_bank_id,
                            lc_received_date: newLC.lc_received_date,
                            lc_expire_date: newLC.lc_expire_date,
                            latest_shipment_date: newLC.latest_shipment_date,
                            rdl_bank_id: newLC.rdl_bank_id,
                            remarks: newLC.remarks,
                            company_id: newLC.company_id,
                            status: newLC.status,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    await Promise.all(  
                        (input.orders ?? []).map(async (order) => {
                            const lcOrder = await tx.lc_orders.create({
                                data: {
                                    lc_master_id: newLC.id,
                                    order_id: order.order_id,
                                    dm_pi_no: order.pi_no,
                                },
                            });

                            await tx.lc_orders_history.create({
                                data: {
                                    lc_master_id: newLC.id,
                                    lc_orders_id: lcOrder.id,
                                    order_id: lcOrder.order_id,
                                    dm_pi_no: lcOrder.dm_pi_no,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });

                            return lcOrder;
                        })
                    );

                    return newLC.id;
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateLc: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                lc_quantity: z.number(),
                lc_value: z.number(),
                lc_open_date: z.date(),
                lc_received_date: z.date(),
                lc_expire_date: z.date().optional(),
                latest_shipment_date: z.date().optional(),
                currency_id: z.number(),
                rdl_bank_id: z.number(),
                buyer_bank_id: z.number(),
                status: z.boolean(),
                remarks: z.string().optional(),
                company_id: z.number(),
                orders: z
                    .array(
                        z.object({
                            order_id: z.string(),
                            dm_pi_no: z.string().optional(),
                        })
                    )
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.LC_MASTER]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to update this LC.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const updatedLC = await tx.lc_master.update({
                        where: {
                            id: input.id,
                        },
                        data: {
                            quantity: input.lc_quantity,
                            lc_value: input.lc_value,
                            lc_open_date: input.lc_open_date,
                            lc_received_date: input.lc_received_date,
                            lc_expire_date: input.lc_expire_date,
                            latest_shipment_date:
                                input.latest_shipment_date,
                            currency_id: input.currency_id,
                            rdl_bank_id: input.rdl_bank_id,
                            buyer_bank_id: input.buyer_bank_id,
                            status: input.status,
                            remarks: input.remarks,
                            company_id: input.company_id,
                        },
                    });

                    await tx.lc_master_history.create({
                        data: {
                            lc_master_id: updatedLC.id,
                            lc_no: updatedLC.lc_no,
                            lc_open_date: updatedLC.lc_open_date,
                            quantity: updatedLC.quantity,
                            lc_value: updatedLC.lc_value,
                            buyer_bank_id: updatedLC.buyer_bank_id,
                            lc_received_date: updatedLC.lc_received_date,
                            lc_expire_date: updatedLC.lc_expire_date,
                            latest_shipment_date: updatedLC.latest_shipment_date,
                            rdl_bank_id: updatedLC.rdl_bank_id,
                            remarks: updatedLC.remarks,
                            company_id: updatedLC.company_id,
                            status: updatedLC.status,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const existingOrders =
                        await tx.lc_orders.findMany({
                            where: {
                                lc_master_id: input.id,
                            },
                        });

                    const inputOrders = input.orders ?? [];

                    const inputOrderMap = new Map(
                        inputOrders.map((order) => [
                            order.order_id,
                            order,
                        ])
                    );

                    const existingOrderIds = new Set(
                        existingOrders.map((order) => order.order_id)
                    );

                    const inputOrderIds = new Set(
                        inputOrders.map((order) => order.order_id)
                    );

                    const ordersToUpdate = existingOrders.filter(
                        (order) => order.order_id !== null && inputOrderIds.has(order.order_id)
                    );

                    const newOrders = inputOrders.filter(
                        (order) => order.order_id !== null && !existingOrderIds.has(order.order_id)
                    );

                    const deletedOrders = existingOrders.filter(
                        (order) => order.order_id !== null && !inputOrderIds.has(order.order_id)
                    );

                    const updatedOrders = await Promise.all(
                        ordersToUpdate.map(async (existingOrder) => {
                            const inputOrder = inputOrderMap.get(
                                existingOrder.order_id!
                            );

                            if (!inputOrder) {
                                return null;
                            }

                            const dm_pi_no = inputOrder.dm_pi_no ?? existingOrder.dm_pi_no;

                            if ( existingOrder.dm_pi_no === dm_pi_no) {
                                return existingOrder;
                            }

                            const updatedOrder = await tx.lc_orders.update({
                                where: {
                                    id: existingOrder.id,
                                },
                                data: {
                                    dm_pi_no,
                                },
                            });

                            await tx.lc_orders_history.create({
                                data: {
                                    lc_master_id: input.id,
                                    lc_orders_id: existingOrder.id,
                                    order_id: existingOrder.order_id,
                                    dm_pi_no,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });

                            return updatedOrder;
                        })
                    );

                    let createdOrders: Awaited<ReturnType<typeof tx.lc_orders.findMany>> = [];

                    if (newOrders.length > 0) {
                        await tx.lc_orders.createMany({
                            data: newOrders.map((order) => ({
                                lc_master_id: input.id,
                                order_id: order.order_id,
                                dm_pi_no: order.dm_pi_no,
                            })),
                        });

                        createdOrders =await tx.lc_orders.findMany({
                            where: {
                                lc_master_id: input.id,
                                order_id: {
                                    in: newOrders.map(
                                        (order) =>
                                            order.order_id
                                    ),
                                },
                            },
                        });

                        await tx.lc_orders_history.createMany({
                            data: createdOrders.map((order) => ({
                                lc_master_id: input.id,
                                lc_orders_id: order.id,
                                order_id: order.order_id,
                                dm_pi_no: order.dm_pi_no,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            })),
                        });
                    }

                    if (deletedOrders.length > 0) {
                        await tx.lc_orders_history.createMany({
                            data: deletedOrders.map((order) => ({
                                lc_master_id: input.id,
                                lc_orders_id: order.id,
                                order_id: order.order_id,
                                dm_pi_no: order.dm_pi_no,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        });

                        await tx.lc_orders.deleteMany({
                            where: {
                                id: {
                                    in: deletedOrders.map(
                                        (order) => order.id
                                    ),
                                },
                            },
                        });
                    }

                    return {
                        ...updatedLC,
                        updated_orders: updatedOrders.filter(Boolean),
                        created_orders: createdOrders,
                        deleted_orders: deletedOrders,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrdersForLc: protectedProcedure
        .input(
            z.object({
                buyer_id: z.number(),
                lc_id: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create a new LC."
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ order_id: string, ref_no: string, added_at: Date }[]>`
                    SELECT DISTINCT 
                        BO.id AS order_id,
                        BO.ref_no AS ref_no,
                        BO.added_at
                    FROM BUYER_ORDERS AS BO
                    WHERE BO.buyer_id = ${input.buyer_id}
                    AND EXISTS (
                        SELECT 1
                        FROM ORDER_STYLES AS OS
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        WHERE OS.order_id = BO.id
                        AND (
                            NOT EXISTS ( -- shipment not in any LC
                                SELECT 1
                                FROM LC_SHIPMENTS LS
                                WHERE LS.shipment_details_id = SD.id
                            )
                            OR ( -- shipment already in CURRENT LC
                                ${input.lc_id}::uuid IS NOT NULL
                                AND EXISTS (
                                    SELECT 1
                                    FROM LC_SHIPMENTS AS LS
                                    INNER JOIN LC_ORDERS AS LO ON LO.ID = LS.LC_ORDER_ID
                                    WHERE LS.shipment_details_id = SD.id
                                    AND LO.LC_MASTER_ID = ${input.lc_id}
                                )
                            )
                        )
                    )
                    ORDER BY BO.added_at DESC;
                `;

                return orders;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getShipmentDetailsForOrder: protectedProcedure
        .input(
            z.object({
                order_id: z.string(),
                lc_order_id: z.string(), 
            })
        )
        .query(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.LC_MASTER]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to create a new LC."
                });
            }

            try {
                return await ctx.db.$queryRaw<LcDetailsResponse[]>`
                        WITH sid_agg AS (
                            SELECT
                                shipment_detail_id,
                                SUM(quantity) AS quantity
                            FROM SHIPMENT_ITEM_DETAILS
                            GROUP BY shipment_detail_id
                        ),
                        fsd_agg AS (
                            SELECT
                                shipment_detail_id,
                                MAX(exfactory_date) AS exfactory_date,
                                MAX(transfer_rate) AS transfer_rate,
                                MAX(factory_rate) AS factory_rate
                            FROM FACTORY_SHIPMENT_DETAILS
                            GROUP BY shipment_detail_id
                        ),
                        lc_map AS (
                            SELECT
                                LCS.shipment_details_id,
                                LCS.lc_order_id
                            FROM LC_SHIPMENTS LCS
                        ),
                        base AS (
                            SELECT
                                SD.id AS shipment_details_id,
                                OS.style,
                                SD.buyer_po,
                                F.name AS factory_name,
                                FA.exfactory_date,
                                D.name AS destination,
                                SD.fob_rate,
                                FA.transfer_rate,
                                FA.factory_rate,
                                SA.quantity,
                                SD.added_at AS shipment_added_at,
                                -- Status only for THIS LC
                                CASE 
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM lc_map LM
                                        WHERE LM.shipment_details_id = SD.id
                                        AND LM.lc_order_id = ${input.lc_order_id}
                                    )
                                    THEN TRUE
                                    ELSE FALSE
                                END AS status
                            FROM BUYER_ORDERS AS BO
                            INNER JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                            INNER JOIN sid_agg AS SA ON SA.shipment_detail_id = SD.id
                            INNER JOIN fsd_agg AS FA ON FA.shipment_detail_id = SD.id
                            INNER JOIN FACTORIES AS F ON F.id = BO.factory_id
                            INNER JOIN DESTINATIONS AS D ON D.id = SD.destination_id

                            WHERE BO.id = ${input.order_id}

                            -- exclude shipments assigned to OTHER LCs
                            AND NOT EXISTS (
                                SELECT 1
                                FROM lc_map LM
                                WHERE LM.shipment_details_id = SD.id
                                AND LM.lc_order_id <> ${input.lc_order_id}
                            )
                        )
                        SELECT
                            shipment_details_id,
                            status,
                            style,
                            buyer_po AS po,
                            factory_name,
                            exfactory_date,
                            destination,
                            quantity,
                            fob_rate AS rdl_fob,
                            quantity * fob_rate AS rdl_value,
                            CASE 
                                WHEN transfer_rate > 0 
                                    THEN transfer_rate * quantity
                                ELSE factory_rate * quantity
                            END AS factory_transfer_value
                        FROM base
                        ORDER BY shipment_added_at DESC;
                `;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getLCbyId: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC."
                });
            }

            try {
                const lcDataObj = await ctx.db.lc_master.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        id: true,
                        buyer_id: true,
                        lc_no: true,
                        company_id: true,
                        lc_open_date: true,
                        lc_received_date: true,
                        lc_expire_date: true,
                        latest_shipment_date: true,
                        quantity: true,
                        lc_value: true,
                        currency_id: true,
                        rdl_bank_id: true,
                        buyer_bank_id: true,
                        status: true,
                        approved_once: true,
                        remarks: true,
                        lc_amendment_metadata: {
                            select: {
                                amendment_no: true,
                            },
                        },
                        lc_orders: {
                            select: {
                                id: true,
                                order_id: true,
                                dm_pi_no: true,
                                lc_shipments: {
                                    select: {
                                        shipment_details: {
                                            select: {
                                                buyer_po: true,
                                                fob_rate: true,
                                                shipment_item_details: {
                                                    select: {
                                                        quantity: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                const shipmentAndExpire = await ctx.db.$queryRaw<{ latest_shipment_date: Date, expire_date: Date }[]>`
                    SELECT 
                        MAX(FSD.exfactory_date) AS LATEST_SHIPMENT_DATE,
                        MAX(FSD.exfactory_date) + INTERVAL '15 DAYS' AS EXPIRE_DATE
                    FROM lc_master AS LC
                        INNER JOIN lc_orders AS LCO ON LCO.lc_master_id = LC.id
                        INNER JOIN lc_shipments AS LCS ON LCS.lc_order_id = LCO.id
                        INNER JOIN shipment_details AS SD ON SD.id = LCS.shipment_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                    WHERE LC.ID = ${input.id}
                `;

                const lcData = lcDataObj ? {
                    ...lcDataObj,
                    lc_expire_date: shipmentAndExpire[0]?.expire_date ?? lcDataObj.lc_expire_date,
                    latest_shipment_date: shipmentAndExpire[0]?.latest_shipment_date ?? lcDataObj.latest_shipment_date,
                    approved_once: lcDataObj.approved_once || (lcDataObj.lc_amendment_metadata?.amendment_no ?? 0) > 0 ? true : false,
                    order_lc_quantity: lcDataObj.lc_orders.reduce((total, order) => {
                        const orderQuantity = order.lc_shipments.reduce((shipmentTotal, shipment) => {
                            const shipmentQuantity = shipment.shipment_details?.shipment_item_details.reduce((itemTotal, item) => {
                                return itemTotal + item.quantity;
                            }, 0) ?? 0;
                            return shipmentTotal + shipmentQuantity;
                        }, 0);
                        return total + orderQuantity;
                    }, 0),

                    order_lc_value: lcDataObj.lc_orders.reduce((total, order) => {
                        const orderValue = order.lc_shipments.reduce((shipmentTotal, shipment) => {
                            const shipmentValue = (shipment.shipment_details?.fob_rate ?? 0) * (
                                shipment.shipment_details?.shipment_item_details.reduce((itemTotal, item) => {
                                    return itemTotal + item.quantity;
                                }, 0
                            ) ?? 0);
                            return shipmentTotal + shipmentValue;
                        }, 0);
                        return total + orderValue;
                    }, 0),
                    
                    lc_orders: lcDataObj.lc_orders.map(order => ({
                        ...order,
                        po_no: order.lc_shipments.map(s => s?.shipment_details?.buyer_po).join(", "),
                    }))
                } : null;

                return lcData;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addShipmentsToLc: protectedProcedure
        .input(
            z.object({
                lc_order_id: z.string(),
                shipment_details_ids: z.array(z.string()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.LC_MASTER]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update this LC."
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const existingShipments = await tx.lc_shipments.findMany({
                        where: {
                            lc_order_id: input.lc_order_id,
                        }
                    });

                    const existingShipmentIds = existingShipments.map(s => s.shipment_details_id);

                    const newShipmentDetailsIds = input.shipment_details_ids.filter(id => !existingShipmentIds.includes(id));

                    const shipmentsToBeDeleted = existingShipments.filter(
                        s => s.shipment_details_id && !input.shipment_details_ids.includes(s.shipment_details_id)
                    );

                    for (const shipment of shipmentsToBeDeleted) {
                        await tx.lc_shipments_history.create({
                            data: {
                                lc_shipments_id: shipment.id,
                                lc_order_id: shipment.lc_order_id,
                                shipment_details_id: shipment.shipment_details_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });

                        await tx.lc_shipments.delete({
                            where: {
                                id: shipment.id,
                            }
                        });
                    }

                    for (const shipment_details_id of newShipmentDetailsIds) {
                        const newShipment = await tx.lc_shipments.create({
                            data: {
                                lc_order_id: input.lc_order_id,
                                shipment_details_id,
                            }
                        });

                        await tx.lc_shipments_history.create({
                            data: {
                                lc_shipments_id: newShipment.id,
                                lc_order_id: newShipment.lc_order_id,
                                shipment_details_id: newShipment.shipment_details_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            }
                        });
                    }
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteOrderFromLc: protectedProcedure
        .input(
            z.object({
                lc_order_id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.LC_MASTER]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update this LC."
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const shipments = await tx.lc_shipments.findMany({
                        where: {
                            lc_order_id: input.lc_order_id,
                        }
                    });

                    for (const shipment of shipments) {
                        await tx.lc_shipments_history.create({
                            data: {
                                lc_shipments_id: shipment.id,
                                lc_order_id: shipment.lc_order_id,
                                shipment_details_id: shipment.shipment_details_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });

                        await tx.lc_shipments.delete({
                            where: {
                                id: shipment.id,
                            }
                        });
                    }

                    const deletedLCOrder = await tx.lc_orders.delete({
                        where: {
                            id: input.lc_order_id,
                        }
                    });

                    await tx.lc_orders_history.create({
                        data: {
                            lc_master_id: deletedLCOrder.lc_master_id,
                            lc_orders_id: deletedLCOrder.id,
                            order_id: deletedLCOrder.order_id,
                            dm_pi_no: deletedLCOrder.dm_pi_no,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    getAuthorizations: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Master LC details." 
                });
            }

            try {
                const authorizationState = await ctx.db.lc_master.findUnique({
                    where: { id: input.id },
                    select: {
                        is_authorized: true,
                    }
                });

                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number}[]>`
                    SELECT 
                        department_id, level_id 
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.LC_MASTER}
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

        
    approveLcAuthorization: protectedProcedure
        .input(z.object({
            id: z.string(),
            is_authorized: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_approve = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_approve) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve LC." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const userLevel = ctx.user.level_id;
                    const userDepartment = ctx.user.department_id;
                    const isAdmin = userLevel === ADMIN_LEVEL_ID && userDepartment === ADMIN_DEPARTMENT_ID;

                    const can_approve = await tx.$queryRaw<{ can_approve: boolean }[]>`
                        SELECT 
                            1 as can_approve
                        FROM AUTHORIZATIONS
                        WHERE module_id = ${m.LC_MASTER}
                            AND level_id = ${userLevel}
                            AND department_id = ${userDepartment}
                        LIMIT 1;
                    `;

                    if (can_approve.length === 0 && !isAdmin) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You do not have permission to Authorize this LC.",
                        });
                    }

                    const updatedLC = await tx.lc_master.update({
                        where: { id: input.id },
                        data: {
                            is_authorized: input.is_authorized,
                        }
                    });

                    await tx.lc_master_history.create({
                        data: {
                            lc_master_id: updatedLC.id,
                            lc_no: updatedLC.lc_no,
                            lc_open_date: updatedLC.lc_open_date,
                            quantity: updatedLC.quantity,
                            lc_value: updatedLC.lc_value,
                            buyer_bank_id: updatedLC.buyer_bank_id,
                            lc_received_date: updatedLC.lc_received_date,
                            lc_expire_date: updatedLC.lc_expire_date,
                            latest_shipment_date: updatedLC.latest_shipment_date,
                            rdl_bank_id: updatedLC.rdl_bank_id,
                            remarks: updatedLC.remarks,
                            company_id: updatedLC.company_id,
                            status: updatedLC.status,
                            is_authorized: updatedLC.is_authorized,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        }
                    });

                    return updatedLC;
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkExfactoryOfShipment: protectedProcedure
        .input(z.object({
            shipment_details_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_MASTER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Master LC details." 
                });
            }

            try {
                const hasExfactory = await ctx.db.exfactory_shipments.findFirst({
                    where: {
                        shipment_details_id: input.shipment_details_id,
                    },
                });

                return hasExfactory?.id ? true : false;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})
