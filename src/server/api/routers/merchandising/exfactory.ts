import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma, shipment_modes } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { Exfactory, ExfactoryShipments, PendingExFactory } from "./_types/exfactory";

export const exFactoryRouter = createTRPCRouter({
    getExFactories: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const results = await ctx.db.$queryRaw<Exfactory[]>`
                    WITH EX_FACTORIES AS (
                        SELECT 
                            E.ID AS id,
                            E.exfactory_no AS exfactory_no,
                            E.exfactory_date AS exfactory_date,
                            B.buyer_name AS buyer_name,
                            F.name AS factory_name,
                            E.IS_AUTHORIZED AS is_authorized,
                            STRING_AGG(DISTINCT SD.buyer_po, ', ') AS pos,
                            STRING_AGG(DISTINCT OS.style, ', ') AS styles,
                            E.ADDED_AT AS ADDED_AT
                        FROM exfactory AS E
                            INNER JOIN buyers AS B ON E.buyer_id = B.id
                            INNER JOIN factories AS F ON E.factory_id = F.id
                            LEFT JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                            LEFT JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.ID
                            LEFT JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            LEFT JOIN order_styles AS OS ON OS.id = SD.order_style_id
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
                                WHERE T.BUYER_ID = E.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY E.ID, B.ID, F.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM EX_FACTORIES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
                const exFactories = results.map(({total_count: _, ...exFactories}) => exFactories);

                return { exFactories, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchExFactories: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const results = await ctx.db.$queryRaw<Exfactory[]>`
                   WITH EX_FACTORIES AS (
                        SELECT 
                            E.ID AS id,
                            E.exfactory_no,
                            E.exfactory_date,
                            B.buyer_name,
                            F.name AS factory_name,
                            E.IS_AUTHORIZED,
                            STRING_AGG(DISTINCT SD.buyer_po, ', ') AS pos,
                            STRING_AGG(DISTINCT OS.style, ', ') AS styles,
                            STRING_AGG(DISTINCT BO.ref_no, ', ') AS ref_nos,
                            E.ADDED_AT
                        FROM exfactory AS E
                            INNER JOIN buyers AS B ON E.buyer_id = B.id
                            INNER JOIN factories AS F ON E.factory_id = F.id
                            LEFT JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                            LEFT JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.ID
                            LEFT JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            LEFT JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            LEFT JOIN buyer_orders AS BO ON BO.id = OS.order_id
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
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = E.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY E.ID, B.ID, F.ID
                    )

                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM EX_FACTORIES
                    WHERE (
                        exfactory_no ILIKE '%' || ${input.query} || '%'
                        OR buyer_name ILIKE '%' || ${input.query} || '%'
                        OR factory_name ILIKE '%' || ${input.query} || '%'
                        OR pos ILIKE '%' || ${input.query} || '%'
                        OR styles ILIKE '%' || ${input.query} || '%'
                        OR ref_nos ILIKE '%' || ${input.query} || '%'
                    )
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                ;`;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                
                const exFactories = results.map(({total_count: _, ...exFactories}) => {
                    return {
                        ...exFactories,
                    }
                });

                return { exFactories, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteExFactory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.EX_FACTORIES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete ex-factory records." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const exfactory = await tx.exfactory.findUnique({
                        where: { id: input.id },
                    });

                    if (!exfactory) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Ex-factory record not found." 
                        });
                    }

                    if(exfactory.is_authorized) {
                        throw new TRPCError({ 
                            code: "FORBIDDEN", 
                            message: "Authorized ex-factory records cannot be deleted." 
                        });
                    }

                    const shipments = await tx.exfactory_shipments.findMany({
                        where: {
                            exfactory_orders: {
                                exfactory_id: exfactory.id,
                            },
                        },
                    });

                    for (const shipment of shipments) {
                        await tx.exfactory_shipments_history.create({
                            data: {
                                exfactory_orders_id: shipment.exfactory_orders_id,
                                shipment_details_id: shipment.shipment_details_id,
                                changed_shipment_mode: shipment.changed_shipment_mode,
                                delivery_quantity: shipment.delivery_quantity,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await tx.exfactory_shipments.deleteMany({
                        where: {
                            exfactory_orders: {
                                exfactory_id: input.id,
                            },
                        },
                    });

                    const orders = await tx.exfactory_orders.findMany({
                        where: {
                            exfactory_id: input.id,
                        },
                    });

                    for (const order of orders) {
                        await tx.exfactory_orders_history.create({
                            data: {
                                order_id: order.order_id,
                                exfactory_id: order.exfactory_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await tx.exfactory_orders.deleteMany({
                        where: {
                            exfactory_id: input.id,
                        },
                    });

                    const deletedExFactory = await tx.exfactory.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    await tx.exfactory_history.create({
                        data: {
                            exfactory_no: deletedExFactory.exfactory_no,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addExfactory: protectedProcedure
        .input(
            z.object({
                buyer_id: z.number().min(1),
                factory_id: z.number().min(1),
                exfactory_date: z.date(),
                remarks: z.string().optional(),
                payment_type: z.string().min(1),
                orders: z.array(
                    z.object({
                        order_id: z.string().min(1),
                        shipments: z.array(
                            z.object({
                                shipment_details_id: z.string().min(1),
                                delivery_quantity: z.number().min(1),
                                po_close: z.boolean().optional(),
                                shipment_mode: z.nativeEnum(shipment_modes).optional(),
                            })
                        ),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.EX_FACTORIES]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add exfactory",
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const currentYear = new Date().getFullYear();

                    const meta = await tx.exfactory_metadata.upsert({
                        where: {
                            year: currentYear,
                        },
                        update: {
                            last_ref: {
                                increment: 1,
                            },
                        },
                        create: {
                            year: currentYear,
                            last_ref: 0,
                        },
                    });

                    const newRef = (meta.last_ref ?? 0) + 1;

                    const exfactory_no = `XFAC/${currentYear}/${String(newRef).padStart(6, "0")}`;

                    const addedExfactory = await tx.exfactory.create({
                        data: {
                            buyer_id: input.buyer_id,
                            factory_id: input.factory_id,
                            exfactory_no,
                            term_id: Number(input.payment_type),
                            exfactory_date: input.exfactory_date,
                            remarks: input.remarks,
                        },
                    });

                    await tx.exfactory_history.create({
                        data: {
                            exfactory_id: addedExfactory.id,
                            exfactory_date: addedExfactory.exfactory_date,
                            exfactory_no: addedExfactory.exfactory_no,
                            buyer_id: addedExfactory.buyer_id,
                            factory_id: addedExfactory.factory_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    const orders = await Promise.all(
                        input.orders.map(async (order) => {
                            const addedOrder = await tx.exfactory_orders.create({
                                data: {
                                    exfactory_id: addedExfactory.id,
                                    order_id: order.order_id,
                                },
                            });

                            await tx.exfactory_orders_history.create({
                                data: {
                                    order_id: addedOrder.order_id,
                                    exfactory_id: addedOrder.exfactory_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });

                            const shipments = await Promise.all(
                                order.shipments.map(async (shipment) => {
                                    const addedShipment =
                                        await tx.exfactory_shipments.create({
                                            data: {
                                                exfactory_orders: {
                                                    connect: {
                                                        id: addedOrder.id,
                                                    },
                                                },
                                                shipment_details: {
                                                    connect: {
                                                        id: shipment.shipment_details_id,
                                                    },
                                                },
                                                delivery_quantity: shipment.delivery_quantity,
                                                po_close: shipment.po_close,
                                                changed_shipment_mode: shipment.shipment_mode,
                                            },
                                        });

                                    await tx.exfactory_shipments_history.create({
                                        data: {
                                            exfactory_shipment_id: addedShipment.id,
                                            exfactory_orders_id: addedOrder.id,
                                            shipment_details_id: addedShipment.shipment_details_id,
                                            delivery_quantity: addedShipment.delivery_quantity,
                                            changed_shipment_mode: addedShipment.changed_shipment_mode,
                                            po_close: addedShipment.po_close,
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                        },
                                    });

                                    return addedShipment;
                                })
                            );

                            return {
                                ...addedOrder,
                                shipments,
                            };
                        })
                    );

                    return {
                        ...addedExfactory,
                        orders,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrdersForExFactory: protectedProcedure
        .input(z.object({
            buyer_id: z.number().min(1),
            factory_id: z.number().min(1),
            payment_term_id: z.number().min(1),
            exfactory_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const getTolerance = await ctx.db.shipment_tolerance_level.findUnique({
                    where: {
                        buyer_id: input.buyer_id                    
                        },
                    select: {   
                        tolerance_level: true,
                    }
                });

                const paymentTerm = await ctx.db.$queryRaw<{ name: string }[]>`
                    SELECT T.NAME FROM payment_terms AS PT
                        INNER JOIN TERMS AS T ON T.id = PT.term_id
                    WHERE PT.id = ${input.payment_term_id};
                `;

                const isLC = paymentTerm?.[0]?.name.toLocaleLowerCase() === "lc";

                const lcTransferCheck = isLC
                    ? Prisma.sql`
                        INNER JOIN SALES_CONTRACT_DETAILS AS SCD ON SCD.order_id = BO.id
                        INNER JOIN SALES_CONTRACTS AS SC ON SC.ID = SCD.sales_contract_id
                        INNER JOIN lc_transfer_details AS LTD ON LTD.sales_contract_id = SCD.sales_contract_id
                    `
                    : Prisma.empty;

            
                const whereClause = input.exfactory_id
                    ? Prisma.sql`
                        EXISTS (
                            SELECT 1
                            FROM EXFACTORY_SHIPMENTS AS ES
                            JOIN EXFACTORY_ORDERS AS EO ON EO.ID = ES.EXFACTORY_ORDERS_ID
                            JOIN EXFACTORY AS E ON E.ID = EO.EXFACTORY_ID
                            WHERE ES.SHIPMENT_DETAILS_ID = SD.ID
                            AND E.ID = ${input.exfactory_id}
                        )
                    `
                    : Prisma.sql`
                        BO.buyer_id = ${input.buyer_id}
                        AND BO.factory_id = ${input.factory_id}
                        AND COALESCE(EQ.total_es_qty, 0)::NUMERIC(18,2) < COALESCE(SQ.total_sid_qty * (1 + ${getTolerance?.tolerance_level ?? 10} / 100), 0)::NUMERIC(18,2)
                        AND COALESCE(EQ.po_close, false) = false
                        AND EXISTS (
                            SELECT 1
                            FROM PAYMENT_TERMS AS PT
                            WHERE PT.id = SD.payment_term_id
                            AND PT.term_id = ${input.payment_term_id}
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM sales_contract_details AS SCD
                            INNER JOIN sales_contracts AS SC 
                                ON SC.id = SCD.sales_contract_id
                            WHERE SCD.order_id = BO.id
                            AND SC.approval_status = 2
                        )
                    `;

                const orders = await ctx.db.$queryRaw<{ order_id: string; ref_no: string; }[]>`
                    WITH shipment_qty AS (
                        SELECT 
                            SD.id AS shipment_detail_id,
                            SUM(SID.quantity) AS total_sid_qty
                        FROM SHIPMENT_DETAILS AS SD
                        JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                        GROUP BY SD.id
                    ),
                    exfactory_qty AS (
                        SELECT 
                            ES.shipment_details_id,
                            COALESCE(BOOL_OR(ES.po_close), false) AS po_close,
                            SUM(ES.delivery_quantity) AS total_es_qty
                        FROM EXFACTORY_SHIPMENTS AS ES
                        GROUP BY ES.shipment_details_id
                    )
                    SELECT
                        BO.ID AS ORDER_ID,
                        BO.REF_NO AS REF_NO
                    FROM BUYER_ORDERS AS BO
                    JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                    JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                    LEFT JOIN shipment_qty AS SQ ON SQ.shipment_detail_id = SD.id
                    LEFT JOIN exfactory_qty AS EQ ON EQ.shipment_details_id = SD.id
                    ${lcTransferCheck}
                    WHERE ${whereClause}
                    GROUP BY BO.ID, BO.REF_NO;
                `;

                return orders;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteExFactoryOrder: protectedProcedure
        .input(z.object({
            exfactory_order_id: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.EX_FACTORIES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete ex-factory orders." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const exfactoryOrder = await tx.exfactory_orders.findUnique({
                        where: { id: input.exfactory_order_id },
                    });

                    if (!exfactoryOrder) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Ex-factory order not found." 
                        });
                    }

                    const shipments = await tx.exfactory_shipments.findMany({
                        where: {
                            exfactory_orders_id: exfactoryOrder.id,
                        },
                    });

                    for (const shipment of shipments) {
                        await tx.exfactory_shipments_history.create({
                            data: {
                                exfactory_orders_id: shipment.exfactory_orders_id,
                                shipment_details_id: shipment.shipment_details_id,
                                delivery_quantity: shipment.delivery_quantity,
                                changed_shipment_mode: shipment.changed_shipment_mode,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await Promise.all([
                        await tx.exfactory_shipments.deleteMany({
                            where: {
                                exfactory_orders_id: exfactoryOrder.id,
                            },
                        }),
    
                        await tx.exfactory_orders.delete({
                            where: {
                                id: exfactoryOrder.id,
                            },
                        }),
    
                        await tx.exfactory_orders_history.create({
                            data: {
                                order_id: exfactoryOrder.order_id,
                                exfactory_id: exfactoryOrder.exfactory_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        })
                    ])
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getShipmentsForExFactoryOrder: protectedProcedure
        .input(z.object({
            order_id: z.string().min(1),
            exfactory_id: z.string().optional(),
            payment_type: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const buyerId = await ctx.db.buyer_orders.findUnique({
                    where: { id: input.order_id },
                    select: { buyer_id: true },
                });
                const getTolerance = await ctx.db.shipment_tolerance_level.findUnique({
                    where: {
                        buyer_id: buyerId?.buyer_id                    
                        },
                    select: {   
                        tolerance_level: true,
                    }
                })

                const paymentTerm = await ctx.db.$queryRaw<{ name: string }[]>`
                    SELECT T.NAME FROM payment_terms AS PT
                        INNER JOIN TERMS AS T ON T.id = PT.term_id
                    WHERE PT.id = ${input.payment_type};
                `;

                const isLC = paymentTerm?.[0]?.name.toLocaleLowerCase() === "lc";

                const lcTransferCheck = isLC
                    ? Prisma.sql`
                        INNER JOIN SALES_CONTRACT_DETAILS AS SCD ON SCD.order_id = BO.id
                        INNER JOIN SALES_CONTRACTS AS SC ON SC.ID = SCD.sales_contract_id
                        INNER JOIN lc_transfer_details AS LTD ON LTD.sales_contract_id = SCD.sales_contract_id
                    `
                    : Prisma.empty;

                const whereClause = input.exfactory_id
                    ? Prisma.sql`
                        EXISTS (  
                            SELECT 1
                            FROM EXFACTORY_SHIPMENTS AS ES
                            JOIN EXFACTORY_ORDERS AS EO ON EO.ID = ES.EXFACTORY_ORDERS_ID
                            JOIN EXFACTORY AS E ON E.ID = EO.EXFACTORY_ID
                            WHERE ES.SHIPMENT_DETAILS_ID = SD.ID
                                AND E.ID = ${input.exfactory_id}
                                ${input.order_id 
                                    ? Prisma.sql`AND EO.ORDER_ID = ${input.order_id}` 
                                    : Prisma.empty}
                        )
                    `
                    : Prisma.sql`
                        COALESCE(EQ.total_es_qty, 0)::NUMERIC(18,2) < COALESCE(SQ.total_sid_qty * (1 + ${getTolerance?.tolerance_level ?? 10} / 100), 0)::NUMERIC(18,2)
                        AND COALESCE(SEQ.po_close, false) = false
                        ${input.order_id 
                            ? Prisma.sql`AND BO.id = ${input.order_id}` 
                            : Prisma.empty}
                    `;

                return await ctx.db.$queryRaw<ExfactoryShipments[]>`
                    WITH shipment_qty AS (
                        SELECT 
                            SD.id AS shipment_detail_id,
                            SUM(SID.quantity) AS total_sid_qty,
                            STRING_AGG(C.NAME, ', ') AS COLORS
                        FROM SHIPMENT_DETAILS AS SD
                        JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN COLORS AS C ON C.ID = SID.color_id
                        GROUP BY SD.id
                    ),
                    exfactory_qty AS (
                        SELECT 
                            ES.shipment_details_id,
                            SUM(ES.delivery_quantity) AS total_es_qty
                        FROM EXFACTORY_SHIPMENTS AS ES
                        JOIN EXFACTORY_ORDERS AS EO ON EO.ID = ES.EXFACTORY_ORDERS_ID
                        JOIN EXFACTORY AS E ON E.ID = EO.EXFACTORY_ID
                        WHERE ${input.exfactory_id 
                            ? Prisma.sql`E.ID <> ${input.exfactory_id}` 
                            : Prisma.sql`TRUE`}
                        GROUP BY ES.shipment_details_id, ES.id
                    ),
                    selected_exfactory_qty AS (
                        SELECT 
                            ES.id AS ES_ID,
                            ES.shipment_details_id,
                            ES.delivery_quantity AS delivery_qty,
                            COALESCE(BOOL_OR(ES.po_close), false) AS po_close,
                            ES.changed_shipment_mode AS changed_shipment_mode
                        FROM EXFACTORY_SHIPMENTS AS ES
                        JOIN EXFACTORY_ORDERS AS EO ON EO.ID = ES.EXFACTORY_ORDERS_ID
                        JOIN EXFACTORY AS E ON E.ID = EO.EXFACTORY_ID
                        WHERE ${input.exfactory_id 
                            ? Prisma.sql`E.ID = ${input.exfactory_id}` 
                            : Prisma.sql`FALSE`}
                        GROUP BY ES.id
                    )
                    SELECT
                        SD.ID AS SHIPMENT_DETAIL_ID,
                        SD.BUYER_PO AS PO,
                        OS.STYLE AS STYLE,
                        D.NAME AS DESTINATION,
                        SQ.COLORS AS COLORS,
                        SQ.total_sid_qty AS LOT_QUANTITY,
                        SEQ.ES_ID AS DB_ID,
                        SUM(EQ.total_es_qty) AS PREVIOUS_SHIPMENT_QUANTITY,
                        COALESCE(SEQ.delivery_qty, 0) AS SHIPMENT_QUANTITY,
                        CASE 
                            WHEN SEQ.changed_shipment_mode IS NOT NULL THEN SEQ.changed_shipment_mode
                            ELSE SD.SHIPMENT_MODE
                        END AS SHIPMENT_MODE,
                        COALESCE(SEQ.po_close, false) AS po_close
                    FROM BUYER_ORDERS AS BO
                        INNER JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        LEFT JOIN shipment_qty AS SQ ON SQ.shipment_detail_id = SD.id
                        LEFT JOIN exfactory_qty AS EQ ON EQ.shipment_details_id = SD.id
                        LEFT JOIN selected_exfactory_qty AS SEQ ON SEQ.shipment_details_id = SD.id
                        INNER JOIN DESTINATIONS AS D ON D.ID = SD.destination_id
                        ${lcTransferCheck}
                    WHERE ${whereClause}
                    GROUP BY SD.ID, 
                        OS.ID, 
                        D.ID, 
                        SQ.COLORS, 
                        SQ.total_sid_qty, 
                        SEQ.ES_ID,
                        SEQ.delivery_qty, 
                        SEQ.changed_shipment_mode,
                        SEQ.po_close;
                `;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getExFactoryById: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const exFactoryObj = await ctx.db.exfactory.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        exfactory_no: true,
                        exfactory_date: true,
                        remarks: true,
                        term_id: true,
                        buyers: {
                            select: {
                                id: true,
                                buyer_name: true,
                            }
                        },
                        factories: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        exfactory_orders: {
                            select: {
                                id: true,
                                buyer_orders: {
                                    select: {
                                        id: true,
                                        ref_no: true,
                                    }
                                },
                            }
                        }
                    }
                });

                const exFactory = {
                    db_id: exFactoryObj?.id,
                    exfactory_no: exFactoryObj?.exfactory_no,
                    payment_type: exFactoryObj?.term_id,
                    factory_id: exFactoryObj?.factories?.id,
                    exfactory_date: exFactoryObj?.exfactory_date,
                    buyer_id: exFactoryObj?.buyers?.id,
                    remarks: exFactoryObj?.remarks,
                    orders: exFactoryObj?.exfactory_orders.map(order => ({
                        db_id: order.id,
                        order_id: order.buyer_orders?.id,
                    }))
                }

                return exFactory;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateExFactory: protectedProcedure
        .input(
            z.object({
                db_id: z.string().min(1),
                exfactory_date: z.date(),
                remarks: z.string().optional(),
                orders: z.array(
                    z.object({
                        db_id: z.string().optional(),
                        shipments: z.array(
                            z.object({
                                shipment_details_id: z.string().min(1),
                                delivery_quantity: z.number().min(1),
                                shipment_mode: z.nativeEnum(shipment_modes).optional(),
                                po_close: z.boolean().optional(),
                            })
                        ),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_edit = ctx.permissions[m.EX_FACTORIES]?.can_update;

            if (!can_edit) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to update ex-factory records.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const exfactory = await tx.exfactory.findUnique({
                        where: {
                            id: input.db_id,
                        },
                    });

                    if (!exfactory) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Ex-factory record not found.",
                        });
                    }

                    if (exfactory.is_authorized) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message:
                                "Authorized ex-factory records cannot be updated.",
                        });
                    }

                    const updatedExfactory = await tx.exfactory.update({
                        where: {
                            id: input.db_id,
                        },
                        data: {
                            exfactory_date: input.exfactory_date,
                            remarks: input.remarks,
                        },
                    });

                    await tx.exfactory_history.create({
                        data: {
                            exfactory_id: exfactory.id,
                            exfactory_date: input.exfactory_date,
                            exfactory_no: exfactory.exfactory_no,
                            buyer_id: exfactory.buyer_id,
                            factory_id: exfactory.factory_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    const orders = await Promise.all(
                        input.orders.map(async (order) => {
                            if (!order.db_id) {
                                return null;
                            }

                            const shipments = await Promise.all(
                                order.shipments.map(async (shipment) => {
                                    const existingShipment =
                                        await tx.exfactory_shipments.findFirst({
                                            where: {
                                                exfactory_orders_id: order.db_id,
                                                shipment_details_id: shipment.shipment_details_id,
                                            },
                                        });

                                    if (!existingShipment) {
                                        return null;
                                    }

                                    await tx.exfactory_shipments_history.create({
                                        data: {
                                            exfactory_shipment_id: existingShipment.id,
                                            exfactory_orders_id: existingShipment.exfactory_orders_id,
                                            shipment_details_id: existingShipment.shipment_details_id,
                                            delivery_quantity: shipment.delivery_quantity,
                                            changed_shipment_mode: shipment.shipment_mode,
                                            po_close: shipment.po_close,
                                            action_type: actions.UPDATE,
                                            action_by: ctx.user.id,
                                        },
                                    });

                                    return await tx.exfactory_shipments.update({
                                        where: {
                                            id: existingShipment.id,
                                        },
                                        data: {
                                            delivery_quantity: shipment.delivery_quantity,
                                            changed_shipment_mode: shipment.shipment_mode,
                                            po_close: shipment.po_close,
                                        },
                                    });
                                })
                            );

                            return {
                                order_id: order.db_id,
                                shipments: shipments.filter(Boolean),
                            };
                        })
                    );

                    return {
                        ...updatedExfactory,
                        orders: orders.filter(Boolean),
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
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const authorizationState = await ctx.db.exfactory.findUnique({
                    where: { id: input.id },
                    select: {
                        is_authorized: true,
                    }
                });

                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number}[]>`
                    SELECT 
                        department_id, level_id 
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.EX_FACTORIES}
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

    approveExFactory: protectedProcedure
        .input(z.object({
            id: z.string(),
            approval_status: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_approve = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if(!can_approve) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve ex-factory." 
                });
            }

            try {
                const userLevel = ctx.user.level_id;
                const userDepartment = ctx.user.department_id;
                const isAdmin = userLevel === ADMIN_LEVEL_ID && userDepartment === ADMIN_DEPARTMENT_ID;

                const can_approve = await ctx.db.$queryRaw<{ can_approve: boolean }[]>`
                    SELECT 
                        1 as can_approve
                    FROM AUTHORIZATIONS
                    WHERE module_id = ${m.EX_FACTORIES}
                        AND level_id = ${userLevel}
                        AND department_id = ${userDepartment}
                    LIMIT 1;
                `;

                if (can_approve.length === 0 && !isAdmin) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to Authorize this Ex-Factory.",
                    });
                }

                const updatedExFactory = await ctx.db.exfactory.update({
                    where: { id: input.id },
                    data: {
                        is_authorized: input.approval_status,
                    }
                });

                await ctx.db.exfactory_history.create({
                    data: {
                        exfactory_date: updatedExFactory.exfactory_date,
                        exfactory_no: updatedExFactory.exfactory_no,
                        exfactory_id: input.id,
                        buyer_id: updatedExFactory.buyer_id,
                        factory_id: updatedExFactory.factory_id,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    }
                });

                return updatedExFactory;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteExFactoryShipment: protectedProcedure
        .input(z.object({
            exfactory_shipment_id: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.EX_FACTORIES]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete ex-factory shipments." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const exfactoryShipment = await tx.exfactory_shipments.findUnique({
                        where: { id: input.exfactory_shipment_id },
                        select: {
                            id: true,
                            exfactory_orders_id: true,
                            shipment_details_id: true,
                            delivery_quantity: true,
                            po_close: true,
                        }
                    });

                    if (!exfactoryShipment) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Ex-factory shipment not found." 
                        });
                    }

                    await tx.exfactory_shipments_history.create({
                        data: {
                            exfactory_shipment_id: exfactoryShipment.id,
                            exfactory_orders_id: exfactoryShipment.exfactory_orders_id,
                            shipment_details_id: exfactoryShipment.shipment_details_id,
                            delivery_quantity: exfactoryShipment.delivery_quantity,
                            po_close: exfactoryShipment.po_close,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    await tx.exfactory_shipments.delete({
                        where: {
                            id: input.exfactory_shipment_id,
                        },
                    });
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    pendingExfactoryList: protectedProcedure
        .input(z.object({
            buyer_id: z.number().min(1),
            factory_id: z.number().min(1),
            from_date: z.date(),
            to_date: z.date(),
            limit: z.number().optional(),
            offset: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const results = await ctx.db.$queryRaw<PendingExFactory[]>`
                    WITH EXFACTORY AS (
                        WITH shipment_qty AS (
                            SELECT 
                                SD.id AS shipment_detail_id,
                                SUM(SID.quantity) AS total_sid_qty
                            FROM SHIPMENT_DETAILS AS SD
                            JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                            GROUP BY SD.id
                        ),
                        exfactory_qty AS (
                            SELECT 
                                ES.shipment_details_id,
                                COALESCE(BOOL_OR(ES.po_close), false) AS po_close,
                                SUM(ES.delivery_quantity) AS total_es_qty
                            FROM EXFACTORY_SHIPMENTS AS ES
                            GROUP BY ES.shipment_details_id
                        )
                        SELECT
                            BO.ID AS ORDER_ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            BO.REF_NO AS ORDER_REF,
                            OS.STYLE AS STYLE,
                            SD.BUYER_PO AS PO,
                            FSD.exfactory_date AS EXFACTORY_DATE,
                            COALESCE(SQ.total_sid_qty, 0) AS TOTAL_QUANTITY,
                            COALESCE(EQ.total_es_qty, 0)AS TOTAL_DELIVERY_QUANTITY
                        FROM BUYER_ORDERS AS BO
                        INNER JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN BUYERS AS B ON B.ID = BO.buyer_id
                        INNER JOIN FACTORIES AS F ON F.id = BO.factory_id
                        LEFT JOIN shipment_qty AS SQ ON SQ.shipment_detail_id = SD.id
                        LEFT JOIN exfactory_qty AS EQ ON EQ.shipment_details_id = SD.id
                        LEFT JOIN shipment_tolerance_level as STL on STL.buyer_id = BO.buyer_id
                        WHERE                   
                            BO.buyer_id = ${input.buyer_id}
                            AND BO.factory_id = ${input.factory_id}
                            AND COALESCE(EQ.total_es_qty, 0)::NUMERIC(18,2) < COALESCE(SQ.total_sid_qty * (1 + COALESCE(STL.tolerance_level, 10) / 100), 0)::NUMERIC(18,2)
                            AND COALESCE(EQ.po_close, false) = false
                            AND FSD.exfactory_date BETWEEN ${input.from_date} AND ${input.to_date}
                        GROUP BY BO.ID, B.ID, F.ID, OS.ID, SD.id, SQ.total_sid_qty, EQ.total_es_qty, FSD.exfactory_date
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM EXFACTORY
                    LIMIT ${input.limit}    
                    OFFSET ${input.offset};
                `;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;

                return {results, count: total};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    searchPendingExFactories: protectedProcedure
        .input(z.object({
            search_term: z.string().optional(),
            limit: z.number().optional(),
            offset: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;
            
            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const results = await ctx.db.$queryRaw<PendingExFactory[]>`
                    WITH EXFACTORY AS (
                        WITH shipment_qty AS (
                            SELECT
                                SD.id AS shipment_detail_id,
                                SUM(SID.quantity) AS total_sid_qty
                            FROM SHIPMENT_DETAILS AS SD
                            JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                            GROUP BY SD.id
                        ),
                        exfactory_qty AS (
                            SELECT
                                ES.shipment_details_id,
                                COALESCE(BOOL_OR(ES.po_close), false) AS po_close,
                                SUM(ES.delivery_quantity) AS total_es_qty
                            FROM EXFACTORY_SHIPMENTS AS ES
                            GROUP BY ES.shipment_details_id
                        )
                        SELECT
                            BO.ID AS ORDER_ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            BO.REF_NO AS ORDER_REF,
                            OS.STYLE AS STYLE,
                            SD.BUYER_PO AS PO,
                            FSD.exfactory_date AS EXFACTORY_DATE,
                            COALESCE(SQ.total_sid_qty, 0) AS TOTAL_QUANTITY,
                            COALESCE(EQ.total_es_qty, 0)AS TOTAL_DELIVERY_QUANTITY
                        FROM BUYER_ORDERS AS BO 
                        INNER JOIN ORDER_STYLES AS OS ON OS.order_id = BO.id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.order_style_id = OS.id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN BUYERS AS B ON B.ID = BO.buyer_id
                        INNER JOIN FACTORIES AS F ON F.id = BO.factory_id
                        LEFT JOIN shipment_qty AS SQ ON SQ.shipment_detail_id = SD.id
                        LEFT JOIN exfactory_qty AS EQ ON EQ.shipment_details_id = SD.id
                        LEFT JOIN shipment_tolerance_level as STL on STL.buyer_id = BO.buyer_id
                        WHERE
                            COALESCE(EQ.total_es_qty, 0)::NUMERIC(18,2) < COALESCE(SQ.total_sid_qty * (1 + COALESCE(STL.tolerance_level, 10) / 100), 0)::NUMERIC(18,2)
                            AND COALESCE(EQ.po_close, false) = false
                            AND (
                                BO.REF_NO ILIKE '%' || ${input.search_term} || '%' OR
                                B.BUYER_NAME ILIKE '%' || ${input.search_term} || '%' OR
                                F.NAME ILIKE '%' || ${input.search_term} || '%' OR
                                OS.STYLE ILIKE '%' || ${input.search_term} || '%' OR
                                SD.BUYER_PO ILIKE '%' || ${input.search_term} || '%'
                            )
                        GROUP BY BO.ID, B.ID, F.ID, OS.ID, SD.id, SQ.total_sid_qty, EQ.total_es_qty, FSD.exfactory_date
                    )
                    SELECT *,
                        COUNT(*) OVER() AS total_count
                    FROM EXFACTORY
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;

                return {results, count: total};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkCommercialProcedure: protectedProcedure
        .input(z.object({
            exfactory_shipment_id: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            try {
                const exists = await ctx.db.factory_invoice_details.findFirst({
                    where: {
                        exfactory_shipment_id: input.exfactory_shipment_id,
                    },
                });

                return { exists: !!exists?.id };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    checkFactoryInvoice: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.EX_FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view ex-factory records." 
                });
            }

            const exists = await ctx.db.$queryRaw<{exists: boolean}[]>`
                SELECT 
                    COUNT(ES.ID) > 0 AS exists
                FROM exfactory AS E
                    INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                    INNER JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.id
                WHERE EXISTS (
                    SELECT 1
                    FROM factory_invoice_details AS FID
                    WHERE FID.EXFACTORY_SHIPMENT_ID = ES.ID
                )
                AND E.ID = ${input.id};
            `;

            return exists[0];
        })
});

