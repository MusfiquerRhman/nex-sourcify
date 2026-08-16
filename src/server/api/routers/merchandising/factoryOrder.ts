import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { formatDate } from "~/utils/localDateString";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { FactoryOrderRow, GetPDFDataOutput, FactoryOrdersPoDetails } from './_types/factoryOrder';

export const factoryOrderRouter = createTRPCRouter({
    getFactoryOrders: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),  
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Factory Orders.",
                });
            }
            
            try {
                const rows = await ctx.db.$queryRaw<(FactoryOrderRow & { total_count: bigint })[]>`
                    SELECT
                        FO.id,
                        BO.ref_no,
                        B.buyer_name,
                        F.name AS factory_name,
                        BO.order_date,
                        FO.factory_order_date,
                        BD.department,
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                WHERE BOS.order_id = BO.id
                            ) THEN -1
                            WHEN EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                LEFT JOIN shipment_details SH ON SH.order_style_id = BOS.id
                                LEFT JOIN shipment_item_details SC ON SC.shipment_detail_id = SH.id
                                WHERE BOS.order_id = BO.id
                                GROUP BY BOS.id, BOS.order_quantity
                                HAVING COALESCE(SUM(SC.quantity), 0) < BOS.order_quantity
                            ) THEN -1
                            ELSE FO.approval_status
                        END AS approval_status,
                        COUNT(*) OVER() AS total_count
                    FROM BUYER_ORDERS AS BO
                    INNER JOIN BUYERS AS B ON BO.buyer_id = B.id
                    INNER JOIN BUYER_DEPARTMENTS AS BD ON BO.department_id = BD.id
                    INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                    INNER JOIN FACTORIES AS F ON F.ID = BO.factory_id
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
                            WHERE TM.TEAM_ID = BO.TEAM_ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    ORDER BY BO.added_at DESC, BO.order_date DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

                const factoryOrders = rows.map(({ total_count: _, ...rest }) => rest);

                return {
                    factoryOrders,
                    total: totalCount,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchFactoryOrders: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),            
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view Factory Orders.' 
                });
            }

            try {
                const rows = await ctx.db.$queryRaw<(FactoryOrderRow & { total_count: bigint })[]>`
                    SELECT
                        FO.id,
                        BO.ref_no,
                        B.buyer_name,
                        F.name AS factory_name,
                        BO.order_date,
                        FO.factory_order_date,
                        BD.department,
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                WHERE BOS.order_id = BO.id
                            ) THEN -1
                            WHEN EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                LEFT JOIN shipment_details SH ON SH.order_style_id = BOS.id
                                LEFT JOIN shipment_item_details SC ON SC.shipment_detail_id = SH.id
                                WHERE BOS.order_id = BO.id
                                GROUP BY BOS.id, BOS.order_quantity
                                HAVING COALESCE(SUM(SC.quantity), 0) < BOS.order_quantity
                            ) THEN -1
                            ELSE FO.approval_status
                        END AS approval_status,
                        COUNT(*) OVER() AS total_count
                    FROM BUYER_ORDERS AS BO
                    INNER JOIN BUYERS AS B ON BO.buyer_id = B.id
                    INNER JOIN BUYER_DEPARTMENTS AS BD ON BO.department_id = BD.id
                    INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                    INNER JOIN FACTORIES AS F ON F.ID = BO.factory_id
                    LEFT JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                    LEFT JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
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
                            WHERE TM.TEAM_ID = BO.TEAM_ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    AND (
                        BO.ref_no ILIKE '%' || ${input.query} || '%'
                        OR B.buyer_name ILIKE '%' || ${input.query}  || '%'
                        OR BD.department ILIKE '%' || ${input.query}  || '%'
                        OR FO.factory_order_date::text ILIKE '%' || ${input.query}  || '%'
                        OR BO.order_date::text ILIKE '%' || ${input.query}  || '%'
                        OR F.name ILIKE '%' || ${input.query}  || '%'
                        OR OS.style ILIKE '%' || ${input.query}  || '%'
                        OR SD.buyer_po ILIKE '%' || ${input.query}  || '%'
                    )
                    GROUP BY BO.id, FO.id, B.buyer_name, F.name, BD.department
                    ORDER BY BO.added_at DESC, BO.order_date DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

                const factoryOrders = rows.map(({ total_count: _, ...rest }) => rest);

                return {
                    factoryOrders,
                    total: totalCount,
                };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),            

    getBuyerOrdersForFactoryOrder: protectedProcedure
        .query(async ({ ctx }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Buyer Orders.",
                });
            }
            
            try {
                const buyerOrders = await ctx.db.$queryRaw<{ id: string; ref_no: string }[]>`
                    WITH style_shipments AS (
                        SELECT
                            OS.id AS style_id,
                            OS.order_id,
                            OS.order_quantity,
                            COALESCE(SUM(SID.quantity), 0) AS shipped_qty
                        FROM ORDER_STYLES OS
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                        GROUP BY OS.id, OS.order_id, OS.order_quantity
                    )
                    SELECT 
                        BO.ID, BO.REF_NO
                    FROM BUYER_ORDERS AS BO
                    INNER JOIN style_shipments AS SS ON SS.order_id = BO.id
                    WHERE BO.ID NOT IN (
                        SELECT ORDER_ID FROM FACTORY_ORDERS
                    )
                    AND SS.order_quantity = SS.shipped_qty
                    AND (
                        EXISTS ( -- User is admin
                            SELECT 1
                            FROM USERS U
                            WHERE U.ID = ${ctx.user.id}
                            AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                            AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS ( -- user is team member assigned to the Buyer Order
                            SELECT 1
                            FROM TEAM_MEMBERS TM
                            WHERE TM.TEAM_ID = BO.TEAM_ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    GROUP BY BO.ID, BO.REF_NO;
                `;
                return buyerOrders;
            }
            catch (error) {
                            handlePrismaError(error);
            }
        }),

    getBuyerOrderDetailsByFactoryOrderId: protectedProcedure
        .input(z.object({
            orderId: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Buyer Orders.",
                });
            }
            
            try {
                const buyerOrderDetailsObj = await ctx.db.buyer_orders.findUnique({
                    where: { id: input.orderId },
                    select: {
                        id: true,
                        ref_no: true,
                        order_date: true,
                        currency_rate: true,
                        factories: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        buyers: {
                            select: {
                                id: true,
                                buyer_name: true,
                            },
                        },
                        seasons: {
                            select: {
                                id: true,
                                season_name: true,
                            },
                        },
                        buyer_departments: {
                            select: {
                                id: true,
                                department: true,
                            },
                        },
                        order_styles: {
                            select: {
                                id: true,
                                style: true,
                                order_quantity: true,
                                product_types: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                products: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                fabrics: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                fabric_suppliers: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                shipment_details: {
                                    orderBy: {
                                        serial: 'asc', 
                                    },
                                    select: {
                                        id: true,
                                        serial: true,
                                        shipment_item_details: {
                                            select: {
                                                id: true,
                                                quantity: true,
                                                colors: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                    }
                                                }
                                            },
                                        },
                                        buyer_po: true,
                                        etd_date: true,
                                        handover_date: true,
                                        destinations: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                        shipment_mode: true,
                                        payment_terms: {
                                            select: {
                                                id: true,
                                                term_description: true,
                                                tenor: true,
                                                terms: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                    }
                                                }
                                            },
                                        },
                                        buyer_department_sizes: {
                                            select: {
                                                id: true,
                                                size: true,
                                            },
                                        },
                                        fob_rate: true,
                                    }
                                }
                            },
                        }
                    }
                });

                const buyerOrderDetails = buyerOrderDetailsObj ? {
                    id: buyerOrderDetailsObj.id,
                    ref_no: buyerOrderDetailsObj.ref_no,
                    order_date: buyerOrderDetailsObj.order_date,
                    factory_name: buyerOrderDetailsObj.factories?.name,
                    buyer_name: buyerOrderDetailsObj.buyers?.buyer_name,
                    season_name: buyerOrderDetailsObj.seasons?.season_name,
                    department_name: buyerOrderDetailsObj.buyer_departments?.department,
                    factory_order_date: new Date(),
                    currency_rate: buyerOrderDetailsObj.currency_rate,
                    styles: buyerOrderDetailsObj.order_styles.map((os) => ({
                        db_id: os.id,
                        style: os.style,
                        order_quantity: os.order_quantity,
                        product_type_name: os.product_types?.name,
                        product_name: os.products?.name,
                        fabric_name: os.fabrics?.name,
                        supplier_name: os.fabric_suppliers?.name,
                        shipments: os.shipment_details.map((sd) => ({
                            db_id: sd.id,
                            delivery_no: sd.serial,
                            buyer_po: sd.buyer_po,
                            etd_date: sd.etd_date,
                            handover_date: sd.handover_date,
                            destination_name: sd.destinations.name,
                            shipment_mode: sd.shipment_mode,
                            payment_term: sd.payment_terms.terms?.name + ' ' + sd.payment_terms.tenor + ' ' + sd.payment_terms.term_description,
                            size_name: sd.buyer_department_sizes.size,
                            lot_quantity: sd.shipment_item_details.reduce((acc, item) => acc + item.quantity, 0),
                            fob_rate: sd.fob_rate,
                            colors: sd.shipment_item_details
                                .map((sid) => `${sid.colors?.name ?? "Unknown"} (${sid.quantity})`)
                                .join(", "),
                        })),
                    })),
                } : null;

                return buyerOrderDetails;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addFactoryOrder: protectedProcedure
        .input(
            z.object({
                order_id: z.string().min(1),
                factory_order_date: z
                    .string()
                    .min(1, "Factory Order Date is required"),
                remarks: z.string().optional(),
                currency_id: z.number().optional(),
                currency_rate: z.number().optional(),
                shipments: z.array(
                    z.object({
                        shipment_id: z.string().min(1),
                        exfactory_date: z
                            .string()
                            .min(1, "Exfactory Date is required"),
                        factory_fob: z
                            .number()
                            .gt(0, "Factory FOB Rate can't be zero"),
                        transfer_rate: z.number().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.FACTORY_ORDERS]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to add Factory Orders.",
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const factoryOrderDate = new Date(
                        input.factory_order_date
                    );

                    const factoryOrder = await tx.factory_orders.create({
                        data: {
                            order_id: input.order_id,
                            factory_order_date: factoryOrderDate,
                            currency_id: input.currency_id,
                            currency_rate: input.currency_rate,
                            remarks: input.remarks,
                            approval_status: 0,
                        },
                    });

                    await tx.factory_orders_history.create({
                        data: {
                            factory_order_id: factoryOrder.id,
                            factory_order_date: factoryOrderDate,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED,
                            remarks: input.remarks,
                            order_id: input.order_id,
                            approval_status: 0,
                            currency_id: input.currency_id,
                            currency_rate: input.currency_rate,
                        },
                    });

                    const shipments = await Promise.all(
                        input.shipments.map(async (shipmentInput) => {
                            const exfactoryDate = new Date(
                                shipmentInput.exfactory_date
                            );

                            const shipment =
                                await tx.factory_shipment_details.create({
                                    data: {
                                        factory_order_id: factoryOrder.id,
                                        shipment_detail_id:
                                            shipmentInput.shipment_id,
                                        exfactory_date: exfactoryDate,
                                        factory_rate:
                                            shipmentInput.factory_fob,
                                        transfer_rate:
                                            shipmentInput.transfer_rate,
                                    },
                                });

                            await tx.factory_shipment_details_history.create({
                                data: {
                                    factory_shipment_details: shipment.id,
                                    exfactory_date: shipment.exfactory_date,
                                    factory_rate: shipment.factory_rate,
                                    transfer_rate: shipment.transfer_rate,
                                    action_by: ctx.user.id,
                                    action_type: actions.ADDED,
                                },
                            });

                            return shipment;
                        })
                    );

                    return {
                        ...factoryOrder,
                        shipments,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getFactoryOrderById: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Factory Orders.",
                });
            }
            
            try {
                const users_team = await ctx.db.factory_orders.findFirst({
                    where: {
                        id: input.factoryOrderId,
                    },
                    select: {
                        buyer_orders: {
                            select: {
                                teams: {
                                    select: {
                                        team_members: {
                                            where: {
                                                user_id: ctx.user.id,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                });

                if(!users_team && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view this Factory Order.",
                    });
                }


                const factoryOrder = await ctx.db.factory_orders.findUnique({
                    where: { id: input.factoryOrderId },
                    select: {
                        id: true,
                        order_id: true,
                        factory_order_date: true,
                        remarks: true,
                        approval_status: true,
                        currency_id: true,
                        currency_rate: true,
                        buyer_orders: {
                            select: {
                                id: true,
                                ref_no: true,
                                order_styles: {
                                    select: {
                                        id: true,
                                        shipment_details: {
                                            orderBy: {
                                                serial: 'asc', 
                                            },
                                            select: {
                                                id: true,
                                                factory_shipment_details: {
                                                    select: {
                                                        id: true,
                                                        exfactory_date: true,
                                                        factory_rate: true,
                                                        transfer_rate: true,
                                                    }
                                                },
                                                exfactory_shipments: {
                                                    select: {
                                                        id: true,
                                                    }
                                                }
                                            }
                                        }
                                    },
                                }
                            },
                        },
                    },
                });

                const factoryOrderDetails = factoryOrder ? {
                    id: factoryOrder.id,
                    order_id: factoryOrder.order_id,
                    factory_order_date: factoryOrder.factory_order_date,
                    remarks: factoryOrder.remarks,
                    approval_status: factoryOrder.approval_status,
                    ref_no: factoryOrder.buyer_orders?.ref_no,
                    styles: factoryOrder.buyer_orders?.order_styles.map((os) => ({
                        db_id: os.id,
                        shipments: os.shipment_details.map((sd) => ({
                            db_id: sd.factory_shipment_details?.[0]?.id,
                            exfactory_date: sd.factory_shipment_details?.[0]?.exfactory_date ?? null,
                            factory_fob: sd.factory_shipment_details?.[0]?.factory_rate ?? null,
                            transfer_rate: sd.factory_shipment_details?.[0]?.transfer_rate ?? null,
                            ex_factory_exists: sd.exfactory_shipments?.length > 0,
                        })),
                    })),
                    currency_id: factoryOrder.currency_id,
                    currency_rate: factoryOrder.currency_rate,
                } : null;

                return factoryOrderDetails;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateFactoryOrder: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
            order_id: z.string().min(1),
            factory_order_date: z.string().min(1, "Factory Order Date is required"),
            remarks: z.string().optional(),
            currency_id: z.number().optional(),
            currency_rate: z.number().optional(),
            shipments: z.array(z.object({
                factory_shipment_id: z.string().optional(),
                exfactory_date: z.string().min(1, "Exfactory Date is required"),
                shipment_id: z.string().min(1),
                factory_fob: z.number().gt(0, "Factory FOB Rate can't be zero"),
                transfer_rate: z.number().optional(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.FACTORY_ORDERS]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update Factory Orders.",
                });
            }
            
            try {
                const user_team = await ctx.db.factory_orders.findFirst({
                    where: {
                        id: input.factoryOrderId,
                    },
                    select: {
                        buyer_orders: {
                            select: {
                                teams: {
                                    select: {
                                        team_members: {
                                            where: {
                                                user_id: ctx.user.id,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                });

                if(!user_team && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to update this Factory Order.",
                    });
                }

                const isFactoryOrderAuthorized = await ctx.db.factory_orders.findUnique({
                    where: { id: input.factoryOrderId },
                    select: { approval_status: true },
                });

                const hasPermission = await ctx.db.$queryRaw<{ ID: number | null }[]>`
                    SELECT 
                        EVP.ID
                    FROM ev_permissions AS EVP
                        INNER JOIN buyer_orders AS BO ON BO.buyer_id = EVP.buyer_id
                        INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                    WHERE FO.ID = ${input.factoryOrderId} AND EVP.user_id = ${ctx.user.id};
                `;

                if (!hasPermission && isFactoryOrderAuthorized && (isFactoryOrderAuthorized?.approval_status ?? 0) === 2) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Authorized Factory Orders cannot be updated.",
                    });
                }

                // Start transaction
                const updatedFactoryOrder = await ctx.db.$transaction(async (tx) => {
                    const factoryOrder = await tx.factory_orders.update({ // Update Factory Order
                        where: { id: input.factoryOrderId },
                        data: {
                            factory_order_date: new Date(input.factory_order_date),
                            currency_id: input.currency_id,
                            currency_rate: input.currency_rate,
                            remarks: input.remarks,
                        },
                    });

                    // Log history
                    await tx.factory_orders_history.create({
                        data: {
                            factory_order_id: factoryOrder.id,
                            factory_order_date: new Date(input.factory_order_date),
                            remarks: input.remarks,
                            order_id: input.order_id,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                            approval_status: factoryOrder.approval_status,
                            currency_id: input.currency_id,
                            currency_rate: input.currency_rate,
                        },
                    });

                    for (const shipmentInput of input.shipments) {
                        const hasExfactory = await tx.exfactory_shipments.findFirst({
                            where: { shipment_details_id: shipmentInput.shipment_id },
                        });

                        if(!!hasExfactory) {
                            continue; // Skip updating/deleting shipments that have associated ex-factory records
                        }

                        if(shipmentInput.factory_shipment_id) {
                            const shipment = await tx.factory_shipment_details.update({ // Update Shipment Detail
                                where: { id: shipmentInput.factory_shipment_id },
                                data: {
                                    exfactory_date: new Date(shipmentInput.exfactory_date),
                                    factory_rate: shipmentInput.factory_fob,
                                    transfer_rate: shipmentInput.transfer_rate,
                                },
                            });

                            // Log history
                            await tx.factory_shipment_details_history.create({
                                data: {
                                    factory_shipment_details: shipment.id,
                                    exfactory_date: new Date(shipmentInput.exfactory_date),
                                    factory_rate: shipmentInput.factory_fob,
                                    transfer_rate: shipmentInput.transfer_rate,
                                    action_by: ctx.user.id,
                                    action_type: actions.UPDATE,
                                },
                            });
                        }
                        else {
                            const shipment = await tx.factory_shipment_details.create({ // Add Shipment Detail
                                data: {
                                    factory_order_id: factoryOrder.id,
                                    shipment_detail_id: shipmentInput.shipment_id,
                                    exfactory_date: new Date(shipmentInput.exfactory_date),
                                    factory_rate: shipmentInput.factory_fob,
                                    transfer_rate: shipmentInput.transfer_rate,
                                },
                            });

                            // Log history
                            await tx.factory_shipment_details_history.create({
                                data: {
                                    factory_shipment_details: shipment.id,
                                    shipment_detail_id: shipmentInput.shipment_id,
                                    exfactory_date: new Date(shipmentInput.exfactory_date),
                                    factory_rate: shipmentInput.factory_fob,
                                    transfer_rate: shipmentInput.transfer_rate,
                                    action_by: ctx.user.id,
                                    action_type: actions.ADDED,
                                },
                            });
                        }
                    }

                    return factoryOrder;
                }, {timeout: 30000});

                return updatedFactoryOrder;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    
    getAuthorizations: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Factory Orders.",
                });
            }
            
            try {
                // Check if the factory order is complete and get its approval status
                const authorizations = await ctx.db.$queryRaw<{is_complete: boolean, approval_status: number}[]>`
                    SELECT
                        os_sum.total_order_qty = sid_sum.total_shipment_qty AS is_complete,
                        fo.approval_status
                    FROM factory_orders fo
                    JOIN (
                        SELECT order_id, SUM(order_quantity) AS total_order_qty
                        FROM order_styles
                        GROUP BY order_id
                    ) os_sum ON os_sum.order_id = fo.order_id
                    JOIN (
                        SELECT os.order_id, SUM(sid.quantity) AS total_shipment_qty
                        FROM order_styles os
                        JOIN shipment_details sd ON sd.order_style_id = os.id
                        JOIN shipment_item_details sid ON sid.shipment_detail_id = sd.id
                        GROUP BY os.order_id
                    ) sid_sum ON sid_sum.order_id = fo.order_id
                    WHERE fo.id = ${input.factoryOrderId};
                `;

                // Get the user's authorization permission for factory orders
                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number, approval_level: number}[]>`
                    SELECT 
                        department_id, level_id, approval_level
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.FACTORY_ORDERS}
                        AND level_id = ${ctx.user.level_id}
                        AND department_id = ${ctx.user.department_id}
                    LIMIT 1;
                `;

                return {authorizations: authorizations[0], authorizationPermission: authorizationPermission[0]};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    approveFactoryOrder: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
            approval_status: z.number().min(0).max(2),
            previous_approval_status: z.number().min(0).max(2),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const isCommissionDistributionAuthorized = await ctx.db.$queryRaw<{approval_status: boolean}[]>`
                    SELECT CD.approval_status FROM commission_distributions AS CD
                        INNER JOIN factory_orders AS FO ON FO.order_id = CD.order_id
                    WHERE FO.id = ${input.factoryOrderId};
                `;

                if(isCommissionDistributionAuthorized[0]?.approval_status) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Factory Order with authorized commission distribution cannot be authorized or unauthorized.",
                    });
                }

                const currentApprovalLevel = await ctx.db.factory_orders.findUnique({
                    where: { id: input.factoryOrderId },
                    select: { approval_status: true },
                });


                const authorizationPermission = await ctx.db.$queryRaw<{approval_level: number}[]>`
                    SELECT 
                        approval_level
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.FACTORY_ORDERS}
                        AND level_id = ${ctx.user.level_id}
                        AND department_id = ${ctx.user.department_id}
                    LIMIT 1;
                `;

                if (!currentApprovalLevel) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Factory Order not found.",
                    });
                }

                if(currentApprovalLevel.approval_status !== input.previous_approval_status) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Factory Order approval status has been changed by another user. Try again.",
                    });
                }

                // Check if the user has permission to Authorize / Unauthorize
                if(currentApprovalLevel.approval_status === 0 && input.approval_status === 2) { 
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Factory Order is not 1st level authorized yet.",
                    });
                }
                else if(authorizationPermission?.[0]?.approval_level === 1 && input.approval_status === 2) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to authorize factory order.",
                    });
                }
                else if(authorizationPermission?.[0]?.approval_level === 1 && input.approval_status === 0 && currentApprovalLevel.approval_status === 2) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to Unauthorize Authorized factory orders.",
                    });
                }

                // Update the approval status within a transaction
                const approvedFactoryOrder = await ctx.db.$transaction(async (tx) => {
                    const factoryOrder = await tx.factory_orders.update({
                        where: { id: input.factoryOrderId },
                        data: {
                            approval_status: input.approval_status,
                        },
                    });

                    await tx.factory_orders_history.create({
                        data: {
                            factory_order_id: factoryOrder.id,
                            factory_order_date: factoryOrder.factory_order_date,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                            order_id: factoryOrder.order_id,
                            approval_status: input.approval_status,
                        },
                    });

                    return factoryOrder;
                }, {timeout: 30000});

                return approvedFactoryOrder;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
    }),

    deleteFactoryOrder: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.FACTORY_ORDERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete Factory Orders.",
                });
            }
            
            try {
                const isFactoryOrderAuthorized = await ctx.db.factory_orders.findUnique({
                    where: { id: input.id },
                    select: { approval_status: true },
                });

                if (isFactoryOrderAuthorized && (isFactoryOrderAuthorized?.approval_status ?? 0) > 0) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Authorized Factory Orders cannot be deleted.",
                    });
                }

                const deletedFactoryOrder = await ctx.db.$transaction(async (tx) => {
                    // Delete related factory shipment details first
                    const existingFactoryShipments = await tx.factory_shipment_details.findMany({
                        where: { factory_order_id: input.id },
                    });


                    // Create history records for each shipment detail before deletion
                    for (const shipment of existingFactoryShipments) {
                        const hasExfactory = await tx.exfactory_shipments.findFirst({
                            where: { shipment_details_id: shipment.shipment_detail_id },
                        });

                        if(!!hasExfactory) {
                            throw new TRPCError({
                                code: "FORBIDDEN",
                                message: "Factory Shipments with associated ex-factory records cannot be deleted.",
                            });
                        }

                        await tx.factory_shipment_details_history.create({
                            data: {
                                factory_shipment_details: shipment.id,
                                exfactory_date: shipment.exfactory_date,
                                factory_rate: shipment.factory_rate,
                                transfer_rate: shipment.transfer_rate,
                                action_by: ctx.user.id,
                                action_type: actions.DELETE,
                            },
                        });
                    }

                    // Delete factory shipment details
                    await tx.factory_shipment_details.deleteMany({
                        where: { factory_order_id: input.id },
                    });

                    // Delete factory order history
                    const deletedFactoryOrder = await tx.factory_orders.delete({
                        where: { id: input.id },
                    });

                    // Log deletion in factory orders history
                    await tx.factory_orders_history.create({
                        data: {
                            factory_order_id: deletedFactoryOrder.id,
                            factory_order_date: deletedFactoryOrder.factory_order_date,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                            order_id: deletedFactoryOrder.order_id,
                            approval_status: deletedFactoryOrder.approval_status,
                        },
                    });
                    return deletedFactoryOrder;
                }, {timeout: 30000});

                return deletedFactoryOrder;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
    }),

    getPDFData: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Factory Orders.",
                });
            }
            
            try {
                const isATeamMember = await ctx.db.factory_orders.findUnique({
                    where: {
                        id: input.factoryOrderId,
                        buyer_orders: {
                            teams: {
                                team_members: {
                                    some: {
                                        user_id: ctx.user.id,
                                    }
                                }             
                            }
                        }
                    },
                });

                if(!isATeamMember && (ctx.user.department_id !== 5 || ctx.user.level_id !== 5)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to view this buyer order.'
                    });
                }

                const header = await ctx.db.$queryRaw<GetPDFDataOutput[]>`
                    SELECT 
                        BO.ref_no AS ref_no,
                        FO.factory_order_date AS order_date,
                        B.buyer_name AS buyer_name,
                        BB.brand AS brand_name,
                        BD.department AS department_name,
                        F.name AS factory_name,
                        S.season_name AS season_name,
                        C.name AS currency_name,
                        C.symbol AS currency_symbol,
                        RDL_C.symbol AS rdl_currency_symbol,
                        RDL_C.name AS rdl_currency_name,
                        FO.currency_rate as currency_rate,
                        BO.currency_rate as rdl_currency_rate,
                        FT.name AS fob_type,
                        CONCAT(T.name, ' ', PT.tenor, ' ', PT.term_description) AS payment_term,
                        TE.team_name AS team_name
                    FROM buyer_orders AS BO
                        INNER JOIN factory_orders AS FO ON FO.order_id = BO.id
                        INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                        INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                        INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id
                        INNER JOIN buyer_departments AS BD ON BD.id = BO.department_id
                        INNER JOIN factories AS F ON F.id = BO.factory_id
                        INNER JOIN seasons AS S ON S.id = BO.season_id
                        INNER JOIN currencies AS C ON C.id = FO.currency_id
                        INNER JOIN currencies AS RDL_C ON RDL_C.id = BO.secondary_currency_id
                        INNER JOIN payment_terms AS PT ON PT.id = SD.payment_term_id
                        INNER JOIN terms AS T ON T.ID = PT.term_id
                        INNER JOIN teams AS TE ON TE.ID = BO.team_id
                        INNER JOIN fob_types AS FT ON BO.fob_type_id = FT.id
                    WHERE FO.id = ${input.factoryOrderId}
                    LIMIT 1;
                `;

                const po_details_obj = await ctx.db.$queryRaw<FactoryOrdersPoDetails[]>`
                    SELECT 
                        OS.style AS style,
                        SD.buyer_po AS po,
                        D.name AS destination_name,
                        P.name AS product_name,
                        STRING_AGG(C."name", ', ') AS color_names,
                        BDS.size AS SIZE,
                        SUM(SID.quantity) AS QUANTITY,
                        SD.fob_rate AS RDL_FOB,
                        SUM(SID.quantity) * SD.fob_rate AS RDL_VALUE,
                        FSD.factory_rate AS factory_rate,
                        SUM(SID.quantity) * FSD.factory_rate AS factory_value,
                        FSD.exfactory_date AS exfactory_date
                    FROM buyer_orders AS BO
                        INNER JOIN factory_orders AS FO ON FO.order_id = BO.id
                        INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                        INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN destinations AS D ON D.id = SD.destination_id
                        INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                        INNER JOIN products AS P ON P.id = OS.product_id
                        INNER JOIN colors AS C ON C.id = SID.color_id
                    WHERE FO.id = ${input.factoryOrderId}
                    GROUP BY OS.style, SD.buyer_po, D.name, P.name, BDS.size, SD.fob_rate, SD.id, FSD.factory_rate, FSD.exfactory_date, OS.serial
                    ORDER BY OS.serial, SD.serial;
                `;

                const po_details = po_details_obj.map((item) => ({
                    style: item.style,
                    po: item.po,
                    destination_name: item.destination_name,
                    product_name: item.product_name,
                    color_names: item.color_names,
                    size: item.size,
                    quantity: quantityFormatter(item.quantity),
                    rdl_fob: currencyFormatter(
                        header[0]?.currency_name === header[0]?.rdl_currency_name 
                        ? item.rdl_fob
                        : item.rdl_fob * ((header[0]?.currency_rate ?? 1) / (header[0]?.rdl_currency_rate ?? 1)), 
                        header[0]?.currency_symbol ?? ''),
                    rdl_value: currencyFormatter(
                        header[0]?.currency_name === header[0]?.rdl_currency_name 
                        ? item.rdl_value
                        : item.rdl_value * ((header[0]?.currency_rate ?? 1) / (header[0]?.rdl_currency_rate ?? 1)), 
                        header[0]?.currency_symbol ?? ''),
                    factory_fob: currencyFormatter(item.factory_rate, header[0]?.currency_symbol ?? ''),
                    factory_value: currencyFormatter(item.factory_value, header[0]?.currency_symbol ?? ''),
                    exfactory_date: formatDate(item.exfactory_date),
                }));

                const totalQuantity = po_details_obj.reduce((total, item) => total + Number(item.quantity), 0);
                const totalValue = po_details_obj.reduce((total, item) => 
                    header[0]?.currency_name === header[0]?.rdl_currency_name 
                        ? total + Number(item.rdl_value)
                        : total + Number(item.rdl_value) * ((header[0]?.currency_rate ?? 1) / (header[0]?.rdl_currency_rate ?? 1))
                , 0);
                const totalFactoryValue = po_details_obj.reduce((total, item) => total + Number(item.factory_value), 0);

                const totalQuantityStr = quantityFormatter(totalQuantity);
                const totalValueStr = currencyFormatter(totalValue, header[0]?.currency_symbol ?? '');
                const totalFactoryValueStr = currencyFormatter(totalFactoryValue, header[0]?.currency_symbol ?? '');

                return { header, po_details, results: {totalQuantity: totalQuantityStr, totalValue: totalValueStr, totalFactoryValue: totalFactoryValueStr} }

            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    isCommissionDistributionAuthorized: protectedProcedure
        .input(z.object({
            factoryOrderId: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view Factory Orders.",
                });
            }
            
            try {
                const isCommissionDistributionAuthorized = await ctx.db.$queryRaw<{approval_status: boolean}[]>`
                    SELECT CD.approval_status FROM commission_distributions AS CD
                        INNER JOIN factory_orders AS FO ON FO.order_id = CD.order_id
                    WHERE FO.id = ${input.factoryOrderId}
                    ;
                `;

                return isCommissionDistributionAuthorized[0]?.approval_status ?? false;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});
