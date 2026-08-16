import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, order_status, shipment_modes } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { BuyerOrderRow, GetPDFHeaderOutput, GetPDFPoOutput } from "./_types/buyerOrder";

// delete all colors associated with a shipment
async function deleteColorsByShipmentId(tx: Prisma.TransactionClient, shipmentId: string, userId: string) {
    const colors = await tx.shipment_item_details.findMany({
        where: { shipment_detail_id: shipmentId },
    });

    const isFactoryOrderApproved = await tx.factory_shipment_details.findFirst({
        where: {
            shipment_detail_id: shipmentId,
            factory_orders: {
                approval_status: 2, // Approved status
            }
        },
    });

    if (!!isFactoryOrderApproved) {
        throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Cannot delete colors because the associated factory order is approved.' 
        });
    }

    for (const color of colors) {
        await tx.shipment_item_details_history.create({
            data: {
                shipment_item_details_id: color.id,
                action_type: actions.DELETE,
                action_by: userId,
                quantity: color.quantity,
                shipment_detail_id: color.shipment_detail_id,
                color_id: color.color_id,
            },
        });

        await tx.shipment_item_details.delete({
            where: { id: color.id },
        });
    }
}

// delete the shipment along with all of its colors
async function deleteShipment(tx: Prisma.TransactionClient, shipmentId: string, userId: string) {
    const shipment = await tx.shipment_details.findUnique({
        where: { id: shipmentId },
    });

    const hasExfactory = await tx.exfactory_shipments.findFirst({
        where: { shipment_details_id: shipmentId },
    });

    if(!!hasExfactory) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot delete shipment because it has an associated ex-factory record.'
        }); 
    }

    if (!shipment) return null;
    // delete associated colors
    await deleteColorsByShipmentId(tx, shipmentId, userId);

    const existingCommissionDistributionDetails = await tx.commission_distributions_details.findMany({
        where: { shipment_details_id: shipmentId },
    });

    await tx.commission_distributions_details.deleteMany({
        where: { shipment_details_id: shipmentId },
    });

    await tx.commission_distribution_details_history.createMany({
        data: existingCommissionDistributionDetails.map(detail => ({
            commission_distributions_details_id: detail.id,
            shipment_details_id: detail.shipment_details_id,
            dhaka_commission_percentage: detail.dhaka_commission_percentage ?? 0,
            overseas_commission_percentage: detail.overseas_commission_percentage ?? 0,
            others_commission_percentage: detail.others_commission_percentage ?? 0,
            action_type: actions.DELETE,
            action_by: userId,
        })),
    });

    // delete associated TNA plan details
    const existingTnaPlanDetails = await tx.tna_plan_details.findMany({
        where: { shipment_id: shipmentId },
    })

    await tx.tna_plan_details.deleteMany({
        where: { shipment_id: shipmentId },
    });


    await tx.tna_plan_details_history.createMany({
        data: existingTnaPlanDetails.map(detail => ({
            tna_plan_details_id: detail.id,
            action_type: actions.DELETE,
            action_by: userId,
            tna_plan_id: detail.tna_plan_id,
            shipment_id: detail.shipment_id,
        })),
    });

    // delete associated factory shipments
    const deletedFactoryShipment = await tx.factory_shipment_details.findMany({
        where: { shipment_detail_id: shipmentId },
    });

    for (const fs of deletedFactoryShipment) {
        await tx.factory_shipment_details.delete({
            where: { id: fs.id },
        });

        await tx.factory_shipment_details_history.create({
            data: {
                factory_shipment_details: fs.id,
                shipment_detail_id: fs.shipment_detail_id,
                exfactory_date: fs.exfactory_date,
                factory_rate: fs.factory_rate,
                transfer_rate: fs.transfer_rate,
                action_type: actions.DELETE,
                action_by: userId,
                factory_order_id: fs.factory_order_id,
            },
        });
    }

    // delete the shipment and create a history record
    await tx.shipment_details_history.create({
        data: {
            shipment_detail_id: shipment.id,
            action_type: actions.DELETE,
            action_by: userId,
            order_style_id: shipment.order_style_id,
            serial: shipment.serial,
            etd_date: shipment.etd_date,
            handover: shipment.handover_date,
            destination_id: shipment.destination_id,
            payment_term_id: shipment.payment_term_id,
            size_id: shipment.size_id,
            fob_rate: shipment.fob_rate,
            cancel_status: shipment.cancel_status,
            buyer_po: shipment.buyer_po,
        },
    });

    await tx.shipment_details.delete({
        where: { id: shipmentId },
    });

    return shipment;
}

// delete the style along with all of its shipments and colors
async function deleteStyle(tx: Prisma.TransactionClient, styleId: string, userId: string) {
    const style = await tx.order_styles.findUnique({
        where: { id: styleId },
    });

    if (!style) return null;

    const shipments = await tx.shipment_details.findMany({
        where: { order_style_id: styleId },
    });

    for (const shipment of shipments) {
        await deleteShipment(tx, shipment.id, userId);
    }

    await tx.order_styles_history.create({
        data: {
            order_style_id: style.id,
            action_type: actions.DELETE,
            action_by: userId,
            order_id: style.order_id,
            product_id: style.product_id,
            product_type_id: style.product_type_id,
            style: style.style,
            fabric_id: style.fabric_id,
            supplier_id: style.supplier_id,
            serial: style.serial,
            order_quantity: style.order_quantity,
        },
    });

    await tx.order_styles.delete({
        where: { id: styleId },
    });

    return style;
}

// tRPC procedures for Buyer Orders
export const buyerOrdersRouter = createTRPCRouter({
    getBuyerOrders: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),            
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYER_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view buyer orders.' 
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<BuyerOrderRow[]>`
                    SELECT
                        BO.id,
                        BO.order_date,
                        BO.added_at,
                        B.buyer_name,
                        BO.ref_no,
                        BD.department,
                        S.season_name AS season,
                        T.team_name AS team,
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                WHERE BOS.order_id = BO.id
                            ) THEN 'INCOMPLETE'
                            WHEN EXISTS (
                                SELECT 1
                                FROM order_styles BOS
                                LEFT JOIN shipment_details SH ON SH.order_style_id = BOS.id
                                LEFT JOIN shipment_item_details SC ON SC.shipment_detail_id = SH.id
                                WHERE BOS.order_id = BO.id
                                GROUP BY BOS.id, BOS.order_quantity
                                HAVING COALESCE(SUM(SC.quantity), 0) < BOS.order_quantity
                            ) THEN 'INCOMPLETE'
                            WHEN FO.approval_status = 2 THEN 'APPROVED'
                            ELSE 'PENDING'
                        END AS status,
                        COUNT(*) OVER() AS total_count
                    FROM BUYER_ORDERS BO
                        INNER JOIN TEAMS T ON T.ID = BO.TEAM_ID
                        INNER JOIN BUYERS B ON BO.buyer_id = B.id
                        INNER JOIN BUYER_DEPARTMENTS BD ON BO.department_id = BD.id
                        INNER JOIN SEASONS S ON S.id = BO.season_id
                        LEFT JOIN FACTORY_ORDERS FO ON FO.order_id = BO.id
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

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;

                const buyerOrders = result.map(({ total_count: _, ...row }) => row);

                return {
                    buyerOrders,
                    total,
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteBuyerOrder: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYER_ORDERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to delete buyer orders.' 
                });
            }
            
            try {
                const isFactoryOrderApproved = await ctx.db.factory_orders.findFirst({
                    where: {
                        order_id: input.id,
                        approval_status: 2, // Approved status
                    },
                });

                if (!!isFactoryOrderApproved) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: 'Cannot delete buyer order because the associated factory order is approved.' 
                    });
                }

                const team_member = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        teams: {
                            buyer_orders: {
                                some: {
                                    id: input.id,
                                }
                            },
                        },
                    },
                });

                if(!team_member && (ctx.user.department_id !== 5 || ctx.user.level_id !== 5)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You can only delete buyer orders from your team.'
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const factoryOrders = await tx.factory_orders.findMany({
                        where: { order_id: input.id },
                    });

                    if(factoryOrders.length > 0) {
                        throw new TRPCError({ 
                            code: 'BAD_REQUEST', 
                            message: 'Cannot delete Buyer Order with associated Factory Orders.' 
                        });
                    }

                    const orderStyles = await tx.order_styles.findMany({
                        where: { order_id: input.id },
                    });

                    const shipments = await tx.shipment_details.findMany({
                        where: {
                            order_style_id: {
                                in: orderStyles.map(os => os.id),
                            },
                        },
                    });

                    const shipmentItemDetails = await tx.shipment_item_details.findMany({
                        where: {
                            shipment_detail_id: {
                                in: shipments.map(s => s.id),
                            },
                        },
                    });
                    
                    for (const itemDetail of shipmentItemDetails) {
                        await tx.shipment_item_details_history.create({
                            data: {
                                shipment_item_details_id: itemDetail.id,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                                quantity: itemDetail.quantity,
                                shipment_detail_id: itemDetail.shipment_detail_id,
                                color_id: itemDetail.color_id,
                            },
                        });

                        await tx.shipment_item_details.deleteMany({
                            where: { id: itemDetail.id },
                        });
                    }

                    for( const shipment of shipments) {
                        const hasExfactory = await tx.exfactory_shipments.findFirst({
                            where: { shipment_details_id: shipment.id },
                        });

                        if(!!hasExfactory) {
                            throw new TRPCError({
                                code: 'FORBIDDEN',
                                message: 'Cannot delete shipment because it has an associated ex-factory record.'
                            }); 
                        }

                        await tx.shipment_details_history.create({
                            data: {
                                shipment_detail_id: shipment.id,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                                order_style_id: shipment.order_style_id,
                                serial: shipment.serial,
                                etd_date: shipment.etd_date,
                                handover: shipment.handover_date,
                                destination_id: shipment.destination_id,
                                payment_term_id: shipment.payment_term_id,
                                size_id: shipment.size_id,
                                fob_rate: shipment.fob_rate,
                                cancel_status: shipment.cancel_status,
                                buyer_po: shipment.buyer_po,
                            },
                        });

                        await tx.shipment_details.deleteMany({
                            where: { id: shipment.id },
                        });
                    }

                    for( const orderStyle of orderStyles) {
                        await tx.order_styles_history.create({
                            data: {
                                order_style_id: orderStyle.id,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                                order_id: orderStyle.order_id,
                                product_id: orderStyle.product_id,
                                product_type_id: orderStyle.product_type_id,
                                style: orderStyle.style,
                                fabric_id: orderStyle.fabric_id,
                                supplier_id: orderStyle.supplier_id,
                                serial: orderStyle.serial,
                                order_quantity: orderStyle.order_quantity,
                            },
                        });

                        await tx.order_styles.deleteMany({
                            where: { id: orderStyle.id },
                        });
                    }

                    const deletedBuyerOrder = await tx.buyer_orders.delete({
                        where: { id: input.id },
                    });

                    await tx.buyer_orders_history.create({
                        data: {
                            buyer_order_id: deletedBuyerOrder.id,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                            ref_no: deletedBuyerOrder.ref_no,
                            buyer_id: deletedBuyerOrder.buyer_id,
                            department_id: deletedBuyerOrder.department_id,
                            season_id: deletedBuyerOrder.season_id,
                            brand_id: deletedBuyerOrder.brand_id,
                            order_date: deletedBuyerOrder.order_date,
                            team_id: deletedBuyerOrder.team_id,
                            remarks: deletedBuyerOrder.remarks,
                            factory_id: deletedBuyerOrder.factory_id,
                            secondary_currency_id: deletedBuyerOrder.secondary_currency_id,
                            currency_rate: deletedBuyerOrder.currency_rate,
                            fob_type_id: deletedBuyerOrder.fob_type_id,
                        },
                    });

                    return deletedBuyerOrder;
                }, {timeout: 60000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    searchBuyerOrders: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),            
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYER_ORDERS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view buyer orders.' 
                });
            }

            const result = await ctx.db.$queryRaw<BuyerOrderRow[]>`
                SELECT
                    BO.id,
                    BO.order_date,
                    BO.added_at,
                    B.buyer_name,
                    BO.ref_no,
                    BD.department,
                    S.season_name AS season,
                    T.team_name AS team,
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM order_styles BOS
                            WHERE BOS.order_id = BO.id
                        ) THEN 'INCOMPLETE'
                        WHEN EXISTS (
                            SELECT 1
                            FROM order_styles BOS
                            LEFT JOIN shipment_details SH ON SH.order_style_id = BOS.id
                            LEFT JOIN shipment_item_details SC ON SC.shipment_detail_id = SH.id
                            WHERE BOS.order_id = BO.id
                            GROUP BY BOS.id, BOS.order_quantity
                            HAVING COALESCE(SUM(SC.quantity), 0) < BOS.order_quantity
                        ) THEN 'INCOMPLETE'
                        WHEN FO.approval_status = 2 THEN 'APPROVED'
                        ELSE 'PENDING'
                    END AS status,
                    COUNT(*) OVER() AS total_count
                FROM BUYER_ORDERS BO
                    INNER JOIN TEAMS T ON T.ID = BO.TEAM_ID
                    INNER JOIN BUYERS B ON BO.buyer_id = B.id
                    INNER JOIN BUYER_DEPARTMENTS BD ON BO.department_id = BD.id
                    INNER JOIN SEASONS S ON S.id = BO.season_id
                    LEFT JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                    LEFT JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                    LEFT JOIN FACTORY_ORDERS FO ON FO.order_id = BO.id
                    LEFT JOIN BUYER_BRANDS BB ON BB.id = BO.brand_id
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
                    OR B.buyer_name ILIKE '%' || ${input.query} || '%'
                    OR BD.department ILIKE '%' || ${input.query} || '%'
                    OR S.season_name ILIKE '%' || ${input.query} || '%'
                    OR T.team_name ILIKE '%' || ${input.query} || '%'
                    OR BB.brand ILIKE '%' || ${input.query} || '%'
                    OR OS.style ILIKE '%' || ${input.query} || '%'
                    OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                )
                GROUP BY BO.ID, b.buyer_name, bd.department, s.season_name, T.team_name, FO.approval_status
                ORDER BY BO.added_at DESC, BO.order_date DESC
                LIMIT ${input.limit}    
                OFFSET ${input.offset};
            `;

            const total = result.length > 0 ? Number(result[0]?.total_count) : 0;

            const buyerOrders = result.map(({ total_count: _, ...row }) => row);

            return { buyerOrders, total };
        }),

    addBuyerOrder: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            season_id: z.number(),
            fob_type_id: z.number(),
            order_date: z.date(),
            team_id: z.number(),
            department_id: z.number(),
            brand_id: z.number(),
            factory_id: z.number(),
            secondary_currency_id: z.number().optional(),
            currency_rate: z.number().optional(),
            remarks: z.string().optional(),
            open_status: z.nativeEnum(order_status).optional(),
            styleData: z.array(z.object({
                product_type_id: z.number(),
                product_id: z.number(),
                style: z.string(),
                fabric_id: z.number(),
                supplier_id: z.number(),
                order_quantity: z.number().optional(),
                serial: z.number().optional(),
                shipments: z.array(z.object({
                    delivery_no: z.number(),
                    buyer_po: z.string(),
                    etd_date: z.date(),
                    handover_date: z.date(),
                    destination_id: z.number(),
                    shipment_mode: z.nativeEnum(shipment_modes),
                    size_id: z.number(),
                    fob_rate: z.number(),
                    payment_term_id: z.number(),
                    colors: z.array(z.object({
                        color_id: z.number(),
                        quantity: z.number(),
                    })).optional(),
                })).optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_create = ctx.permissions[m.BUYER_ORDERS]?.can_add;

            if (!can_create) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to create buyer orders.',
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const currentYear = new Date().getFullYear();

                    const meta = await tx.buyer_order_ref_metadata.upsert({
                        where: { year: currentYear },
                        update: {
                            last_serial: {
                                increment: 1,
                            },
                        },
                        create: {
                            year: currentYear,
                            last_serial: 1,
                        },
                    });

                    const buyerShortName = await tx.buyers.findUnique({
                        where: {
                            id: input.buyer_id,
                        },
                        select: {
                            short_name: true,
                        },
                    });

                    const newRefNo = `NEX/${buyerShortName?.short_name}/${currentYear}/${String(meta.last_serial).padStart(4, '0')}`;

                    const newBuyerOrder = await tx.buyer_orders.create({
                        data: {
                            ref_no: newRefNo,
                            buyer_id: input.buyer_id,
                            season_id: input.season_id,
                            fob_type_id: input.fob_type_id,
                            order_date: input.order_date,
                            team_id: input.team_id,
                            department_id: input.department_id,
                            brand_id: input.brand_id,
                            factory_id: input.factory_id,
                            secondary_currency_id: input.secondary_currency_id,
                            currency_rate: input.currency_rate,
                            remarks: input.remarks,
                            status: input.open_status ?? order_status.ACTIVE,
                        },
                    });

                    const styles = await Promise.all(
                        (input.styleData ?? []).map(async (style) => {
                            const orderStyle = await tx.order_styles.create({
                                data: {
                                    order_id: newBuyerOrder.id,
                                    product_type_id: style.product_type_id,
                                    product_id: style.product_id,
                                    style: style.style,
                                    fabric_id: style.fabric_id,
                                    supplier_id: style.supplier_id,
                                    order_quantity: style.order_quantity ?? 0,
                                    serial: style.serial,
                                },
                            });

                            await tx.order_styles_history.create({
                                data: {
                                    order_style_id: orderStyle.id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                    order_id: orderStyle.order_id,
                                    product_id: orderStyle.product_id,
                                    product_type_id: orderStyle.product_type_id,
                                    style: orderStyle.style,
                                    fabric_id: orderStyle.fabric_id,
                                    supplier_id: orderStyle.supplier_id,
                                    serial: orderStyle.serial,
                                    order_quantity: orderStyle.order_quantity,
                                },
                            });

                            const shipments = await Promise.all(
                                (style.shipments ?? []).map(async (shipment) => {
                                    const shipmentDetail = await tx.shipment_details.create({
                                        data: {
                                            order_style_id: orderStyle.id,
                                            serial: shipment.delivery_no,
                                            buyer_po: shipment.buyer_po,
                                            etd_date: shipment.etd_date,
                                            handover_date: shipment.handover_date,
                                            destination_id: shipment.destination_id,
                                            shipment_mode: shipment.shipment_mode,
                                            size_id: shipment.size_id,
                                            fob_rate: shipment.fob_rate,
                                            payment_term_id: shipment.payment_term_id,
                                        },
                                    });

                                    await tx.shipment_details_history.create({
                                        data: {
                                            shipment_detail_id: shipmentDetail.id,
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                            order_style_id: shipmentDetail.order_style_id,
                                            serial: shipmentDetail.serial,
                                            etd_date: shipmentDetail.etd_date,
                                            handover: shipmentDetail.handover_date,
                                            destination_id: shipmentDetail.destination_id,
                                            payment_term_id: shipmentDetail.payment_term_id,
                                            size_id: shipmentDetail.size_id,
                                            fob_rate: shipmentDetail.fob_rate,
                                            cancel_status: shipmentDetail.cancel_status,
                                            buyer_po: shipmentDetail.buyer_po,
                                        },
                                    });

                                    const colors = await Promise.all(
                                        (shipment.colors ?? []).map(async (colorEntry) => {
                                            const itemDetail = await tx.shipment_item_details.create({
                                                data: {
                                                    shipment_detail_id: shipmentDetail.id,
                                                    color_id: colorEntry.color_id,
                                                    quantity: colorEntry.quantity,
                                                },
                                            });

                                            await tx.shipment_item_details_history.create({
                                                data: {
                                                    shipment_item_details_id: itemDetail.id,
                                                    action_type: actions.ADDED,
                                                    action_by: ctx.user.id,
                                                    quantity: itemDetail.quantity,
                                                    shipment_detail_id: itemDetail.shipment_detail_id,
                                                    color_id: itemDetail.color_id,
                                                },
                                            });

                                            return itemDetail;
                                        })
                                    );

                                    return {
                                        ...shipmentDetail,
                                        colors,
                                    };
                                })
                            );

                            return {
                                ...orderStyle,
                                shipments,
                            };
                        })
                    );

                    await tx.buyer_orders_history.create({
                        data: {
                            buyer_order_id: newBuyerOrder.id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                            ref_no: newBuyerOrder.ref_no,
                            buyer_id: newBuyerOrder.buyer_id,
                            department_id: newBuyerOrder.department_id,
                            season_id: newBuyerOrder.season_id,
                            brand_id: newBuyerOrder.brand_id,
                            order_date: newBuyerOrder.order_date,
                            team_id: newBuyerOrder.team_id,
                            remarks: newBuyerOrder.remarks,
                            factory_id: newBuyerOrder.factory_id,
                            secondary_currency_id: newBuyerOrder.secondary_currency_id,
                            currency_rate: newBuyerOrder.currency_rate,
                            fob_type_id: newBuyerOrder.fob_type_id,
                        },
                    });

                    return {
                        order: {
                            ...newBuyerOrder,
                            styles,
                        },
                    };
                }, {timeout: 30000});
            } 
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getBuyerOrderById: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYER_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view buyer orders.' 
                });
            }

            try {
                const buyerOrderObj = await ctx.db.buyer_orders.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        ref_no: true,
                        buyer_id: true,
                        season_id: true,
                        fob_type_id: true,
                        order_date: true,
                        team_id: true,
                        department_id: true,
                        brand_id: true,
                        factory_id: true,
                        secondary_currency_id: true,
                        currency_rate: true,
                        remarks: true,
                        status: true,
                        order_styles: {
                            orderBy: [
                                { serial: "asc" },
                                { added_at: "asc" }
                            ],
                            select: {
                                id: true,
                                product_type_id: true,
                                product_id: true,
                                style: true,
                                fabric_id: true,
                                supplier_id: true,
                                order_quantity: true,
                                serial: true,
                                photo_url: true,
                                file_size: true,
                                shipment_details: {
                                    orderBy: [
                                        { serial: "asc" },
                                        { added_at: "asc" }
                                    ],
                                    select: {
                                        id: true,
                                        serial: true,
                                        buyer_po: true,
                                        etd_date: true,
                                        handover_date: true,
                                        destination_id: true,
                                        shipment_mode: true,
                                        size_id: true,
                                        fob_rate: true,
                                        payment_term_id: true,
                                        shipment_item_details: {
                                            select: {
                                                id: true,
                                                color_id: true,
                                                quantity: true,
                                            },
                                        },

                                        exfactory_shipments: {
                                            select: {
                                                id: true,
                                            }
                                        }
                                    },
                                },
                            },
                        },
                        factory_orders: {
                            select: {
                                approval_status: true
                            }
                        }
                    },
                });

                const users_team = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        team_id: buyerOrderObj?.team_id,
                    },
                });

                if(!users_team && (ctx.user.department_id !== 5 || ctx.user.level_id !== 5)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to view this buyer order.'
                    });
                }

                const buyerOrder = {
                    ...buyerOrderObj,
                    order_styles: buyerOrderObj?.order_styles.map(style => ({
                        ...style,
                        photo_url: style.photo_url || null,
                        shipment_details: style.shipment_details.map(shipment => {
                            const { exfactory_shipments, ...rest } = shipment;

                            return {
                                ...rest,
                                lot_quantity: shipment.shipment_item_details.reduce(
                                    (sum, item) => sum + item.quantity, 0
                                ),
                                ex_factory_exists: exfactory_shipments.length > 0,
                            };
                        }),
                    })),
                };

                return buyerOrder;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateBuyerOrder: protectedProcedure
        .input(z.object({
            db_id: z.string().optional(),
            buyer_id: z.number(),
            season_id: z.number(),
            fob_type_id: z.number(),
            order_date: z.date(),
            team_id: z.number(),
            department_id: z.number(),
            brand_id: z.number(),
            factory_id: z.number(),
            secondary_currency_id: z.number().optional(),
            currency_rate: z.number().optional(),
            remarks: z.string().optional(),
            open_status: z.nativeEnum(order_status).optional(),
            styles: z.array(z.object({
                db_id: z.string().optional(),
                product_type_id: z.number(),
                product_id: z.number(),
                style: z.string(),
                fabric_id: z.number(),
                supplier_id: z.number(),
                order_quantity: z.number().optional(),
                serial: z.number().optional(),
                shipments: z.array(z.object({
                    db_id: z.string().optional(),
                    delivery_no: z.number(),
                    buyer_po: z.string(),
                    etd_date: z.date(),
                    handover_date: z.date(),
                    destination_id: z.number(),
                    shipment_mode: z.nativeEnum(shipment_modes),
                    size_id: z.number(),
                    fob_rate: z.number(),
                    payment_term_id: z.number(),
                    colors: z.array(z.object({
                        db_id: z.string().optional(),
                        color_id: z.number(),
                        quantity: z.number(),
                    })).optional(),
                })).optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_edit = ctx.permissions[m.BUYER_ORDERS]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update buyer orders.',
                    });
                }

                const isFactoryOrderApproved = await ctx.db.factory_orders.findFirst({
                    where: {
                        order_id: input.db_id,
                        approval_status: 2,
                    },
                });

                if (isFactoryOrderApproved) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Cannot update buyer order because the associated factory order is approved.',
                    });
                }

                const existingOrder = await ctx.db.buyer_orders.findUnique({
                    where: {
                        id: input.db_id,
                    },
                });

                const users_team = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        team_id: existingOrder?.team_id,
                    },
                });

                if (!users_team && (ctx.user.department_id !== 5 || ctx.user.level_id !== 5)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update this buyer order.',
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const existingOrder = await tx.buyer_orders.findUnique({
                        where: {
                            id: input.db_id,
                        },
                    });

                    if (!existingOrder) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Buyer order not found.',
                        });
                    }

                    await tx.buyer_orders_history.create({
                        data: {
                            buyer_order_id: existingOrder.id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                            ref_no: existingOrder.ref_no,
                            buyer_id: input.buyer_id,
                            department_id: input.department_id,
                            season_id: input.season_id,
                            brand_id: input.brand_id,
                            order_date: existingOrder.order_date,
                            team_id: input.team_id,
                            remarks: input.remarks,
                            factory_id: input.factory_id,
                            secondary_currency_id: input.secondary_currency_id,
                            currency_rate: input.currency_rate,
                            fob_type_id: existingOrder.fob_type_id,
                        },
                    });

                    const updatedBuyerOrder = await tx.buyer_orders.update({
                        where: {
                            id: input.db_id,
                        },
                        data: {
                            buyer_id: input.buyer_id,
                            season_id: input.season_id,
                            fob_type_id: input.fob_type_id,
                            order_date: input.order_date,
                            team_id: input.team_id,
                            department_id: input.department_id,
                            brand_id: input.brand_id,
                            factory_id: input.factory_id,
                            secondary_currency_id: input.secondary_currency_id,
                            currency_rate: input.currency_rate,
                            remarks: input.remarks,
                            status: input.open_status,
                        },
                    });

                    const styles = await Promise.all(
                        (input.styles ?? []).map(async (style) => {
                            const orderStyle = style.db_id
                                ? await tx.order_styles.update({
                                    where: {
                                        id: style.db_id,
                                    },
                                    data: {
                                        product_type_id: style.product_type_id,
                                        product_id: style.product_id,
                                        style: style.style,
                                        fabric_id: style.fabric_id,
                                        supplier_id: style.supplier_id,
                                        order_quantity: style.order_quantity ?? 0,
                                        serial: style.serial,
                                    },
                                })
                                : await tx.order_styles.create({
                                    data: {
                                        order_id: updatedBuyerOrder.id,
                                        product_type_id: style.product_type_id,
                                        product_id: style.product_id,
                                        style: style.style,
                                        fabric_id: style.fabric_id,
                                        supplier_id: style.supplier_id,
                                        order_quantity: style.order_quantity ?? 0,
                                        serial: style.serial,
                                    },
                                });

                            await tx.order_styles_history.create({
                                data: {
                                    order_style_id: orderStyle.id,
                                    action_type: style.db_id ? actions.UPDATE : actions.ADDED,
                                    action_by: ctx.user.id,
                                    order_id: orderStyle.order_id,
                                    product_id: style.product_id,
                                    product_type_id: style.product_type_id,
                                    style: style.style,
                                    fabric_id: style.fabric_id,
                                    supplier_id: style.supplier_id,
                                    serial: orderStyle.serial,
                                    order_quantity: orderStyle.order_quantity,
                                },
                            });

                            const shipments = await Promise.all(
                                (style.shipments ?? []).map(async (shipment) => {
                                    let shipmentDetail;

                                    if (shipment.db_id) {
                                        const hasExfactory = await tx.exfactory_shipments.findFirst({
                                            where: {
                                                shipment_details_id: shipment.db_id,
                                            },
                                        });

                                        if (hasExfactory) {
                                            return null;
                                        }

                                        shipmentDetail = await tx.shipment_details.update({
                                            where: {
                                                id: shipment.db_id,
                                            },
                                            data: {
                                                serial: shipment.delivery_no,
                                                buyer_po: shipment.buyer_po,
                                                etd_date: shipment.etd_date,
                                                handover_date: shipment.handover_date,
                                                destination_id: shipment.destination_id,
                                                shipment_mode: shipment.shipment_mode,
                                                size_id: shipment.size_id,
                                                fob_rate: shipment.fob_rate,
                                                payment_term_id: shipment.payment_term_id,
                                            },
                                        });
                                    } else {
                                        shipmentDetail = await tx.shipment_details.create({
                                            data: {
                                                order_style_id: orderStyle.id,
                                                serial: shipment.delivery_no,
                                                buyer_po: shipment.buyer_po,
                                                etd_date: shipment.etd_date,
                                                handover_date: shipment.handover_date,
                                                destination_id: shipment.destination_id,
                                                shipment_mode: shipment.shipment_mode,
                                                size_id: shipment.size_id,
                                                fob_rate: shipment.fob_rate,
                                                payment_term_id: shipment.payment_term_id,
                                            },
                                        });
                                    }

                                    await tx.shipment_details_history.create({
                                        data: {
                                            shipment_detail_id: shipmentDetail.id,
                                            action_type: shipment.db_id ? actions.UPDATE : actions.ADDED,
                                            action_by: ctx.user.id,
                                            order_style_id: shipmentDetail.order_style_id,
                                            serial: shipmentDetail.serial,
                                            etd_date: shipment.etd_date,
                                            handover: shipment.handover_date,
                                            destination_id: shipment.destination_id,
                                            payment_term_id: shipment.payment_term_id,
                                            size_id: shipment.size_id,
                                            fob_rate: shipment.fob_rate,
                                            cancel_status: shipmentDetail.cancel_status,
                                            buyer_po: shipmentDetail.buyer_po,
                                        },
                                    });

                                    const colors = await Promise.all(
                                        (shipment.colors ?? []).map(async (colorEntry) => {
                                            const itemDetail = colorEntry.db_id
                                                ? await tx.shipment_item_details.update({
                                                    where: {
                                                        id: colorEntry.db_id,
                                                    },
                                                    data: {
                                                        color_id: colorEntry.color_id,
                                                        quantity: colorEntry.quantity,
                                                    },
                                                })
                                                : await tx.shipment_item_details.create({
                                                    data: {
                                                        shipment_detail_id: shipmentDetail.id,
                                                        color_id: colorEntry.color_id,
                                                        quantity: colorEntry.quantity,
                                                    },
                                                });

                                            await tx.shipment_item_details_history.create({
                                                data: {
                                                    shipment_item_details_id: itemDetail.id,
                                                    action_type: colorEntry.db_id
                                                        ? actions.UPDATE
                                                        : actions.ADDED,
                                                    action_by: ctx.user.id,
                                                    quantity: itemDetail.quantity,
                                                    shipment_detail_id:
                                                        itemDetail.shipment_detail_id,
                                                    color_id: itemDetail.color_id,
                                                },
                                            });

                                            return itemDetail;
                                        })
                                    );

                                    return {
                                        ...shipmentDetail,
                                        colors,
                                    };
                                })
                            );

                            return {
                                ...orderStyle,
                                shipments: shipments.filter(Boolean),
                            };
                        })
                    );

                    return {
                        order: {
                            ...updatedBuyerOrder,
                            styles,
                        },
                    };
                }, {timeout: 60000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteStyle: protectedProcedure
        .input(z.object({
            style_id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.BUYER_ORDERS]?.can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete buyer order styles."
                });
            }

            return ctx.db.$transaction(tx => deleteStyle(tx, input.style_id, ctx.user.id), {timeout: 30000});
        }),


    deleteShipment: protectedProcedure
        .input(z.object({
            shipment_id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.BUYER_ORDERS]?.can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete buyer order shipments."
                });
            }

            return ctx.db.$transaction(tx => deleteShipment(tx, input.shipment_id, ctx.user.id), {timeout: 30000});
        }),


    deleteColor: protectedProcedure
        .input(z.object({
            color_id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYER_ORDERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to delete buyer order shipment colors.' 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const existingColor = await tx.shipment_item_details.findUnique({
                        where: { id: input.color_id },
                    });

                    const hasExfactory = await tx.exfactory_shipments.findFirst({
                        where: { shipment_details_id: existingColor?.shipment_detail_id },
                    });

                    if(!!hasExfactory) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: 'Cannot delete the color because the shipment has an associated ex-factory record.'
                        }); 
                    }

                    await tx.shipment_item_details_history.create({
                        data: {
                            shipment_item_details_id: existingColor?.id ?? '',
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            quantity: existingColor?.quantity ?? 0,
                            shipment_detail_id: existingColor?.shipment_detail_id ?? '',
                            color_id: existingColor?.color_id ?? 0,
                        },
                    });

                    await tx.shipment_item_details.delete({
                        where: { id: input.color_id },
                    });
                    return existingColor;
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPDFData: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYER_ORDERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view buyer order shipment colors.' 
                });
            }

            const isATeamMember = await ctx.db.buyer_orders.findUnique({
                where: { id: input.id },
                select: {
                    teams: {
                        select: {
                            team_members: {
                                where: { user_id: ctx.user.id },
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

            try {
                const header = await ctx.db.$queryRaw<GetPDFHeaderOutput[]>`
                    SELECT 
                        BO.ref_no AS ref_no,
                        BO.order_date AS order_date,
                        B.buyer_name AS buyer_name,
                        BB.brand AS brand_name,
                        BD.department AS department_name,
                        F.name AS factory_name,
                        S.season_name AS season_name,
                        C.name AS currency_name,
                        C.symbol AS currency_symbol,
                        BO.currency_rate
                    FROM buyer_orders AS BO
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                        INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id
                        INNER JOIN buyer_departments AS BD ON BD.id = BO.department_id
                        INNER JOIN factories AS F ON F.id = BO.factory_id
                        INNER JOIN seasons AS S ON S.id = BO.season_id
                        INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                    WHERE BO.id = ${input.id}
                `;

                const po_details_obj = await ctx.db.$queryRaw<GetPDFPoOutput[]>`
                    SELECT 
                        OS.style AS style,
                        SD.buyer_po AS po,
                        D.name AS destination_name,
                        P.name AS product_name,
                        STRING_AGG(C."name", ', ') as color_names,
                        BDS.size AS SIZE,
                        SUM(SID.quantity) AS QUANTITY,
                        SD.fob_rate AS RDL_FOB,
                        SUM(SID.quantity) * SD.fob_rate AS RDL_VALUE
                    FROM buyer_orders AS BO
                        INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                        INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN destinations AS D ON D.id = SD.destination_id
                        INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                        INNER JOIN products AS P ON P.id = OS.product_id
                        INNER JOIN colors AS C ON C.id = SID.color_id
                    WHERE BO.id = ${input.id}
                    GROUP BY OS.style, SD.buyer_po, D.name, P.name, BDS.size, SD.fob_rate, SD.id, OS.serial
                    ORDER BY OS.serial, SD.serial;
                `;

                const po_details = po_details_obj.map(item => ({
                    style: item.style,
                    po: item.po,
                    destination_name: item.destination_name,
                    product_name: item.product_name,
                    color_names: item.color_names,
                    size: item.size,
                    quantity: quantityFormatter(item.quantity),
                    rdl_fob: currencyFormatter(item.rdl_fob, header[0]?.currency_symbol ?? ''),
                    rdl_value: currencyFormatter(item.rdl_value, header[0]?.currency_symbol ?? ''),
                }));

                const totalQuantity = po_details_obj.reduce((total, item) => total + Number(item.quantity), 0);
                const totalValue = po_details_obj.reduce((total, item) => total + Number(item.rdl_value), 0);

                const totalQuantityString = quantityFormatter(totalQuantity);
                const totalValueString = currencyFormatter(totalValue, header[0]?.currency_symbol ?? '');

                return {header, po_details, results: { totalQuantityString, totalValueString }};
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});