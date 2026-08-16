import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { amountToWords, currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { formatDate } from "~/utils/localDateString";
import type { SalesContractResponse, SalesContractPDFHeaderData } from "./_types/salesContract";

export const formatColorQty = (items: { colors: { name: string }; quantity: number }[]): string => {
    const map = items.reduce((acc, item) => {
        const key = item.colors.name;
        acc[key] = (acc[key] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(map).map(([color, qty]) => `${color} (${quantityFormatter(qty)})`).join(', ');
};

export const salesContractsRouter = createTRPCRouter({
    getSalesContracts: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            try {
                const result = await ctx.db.$queryRaw<SalesContractResponse[]>`
                    WITH CONTRACTS AS (
                        SELECT 
                            SC.ID AS ID,
                            SC.SALES_CONTRACT_NO,
                            SC.SALES_CONTRACT_DATE,
                            SUM(ST.FACTORY_VALUE) AS SALES_CONTRACT_VALUE,
                            F.NAME AS FACTORY_NAME,
                            SC.APPROVAL_STATUS,
                            scam.amendment_no as amendment_no,
                            COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
                            SC.ADDED_AT
                        FROM SALES_CONTRACTS AS SC
                            INNER JOIN FACTORIES AS F ON F.id = SC.factory_id
                            LEFT JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            LEFT JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                            LEFT JOIN factory_orders AS FO ON FO.order_id = BO.id
		                    LEFT JOIN currencies AS C ON C.id = FO.currency_id
                            LEFT JOIN SALES_CONTRACT_AMENDMENT_NO_METADATA AS SCAM ON SCAM.sales_contract_id = SC.id
                            LEFT JOIN (
                                SELECT 
                                    OS.order_id AS ORDER_ID,
                                    SUM(SID.QUANTITY) * FSD.FACTORY_RATE AS FACTORY_VALUE
                                FROM order_styles AS OS 
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                    LEFT JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                GROUP BY SD.id, OS.order_id, FSD.factory_rate
                            ) ST ON ST.ORDER_ID = SCD.order_id
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
                                WHERE T.BUYER_ID = SC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY SC.ID, 
                            F.NAME, 
                            SC.ADDED_AT, 
                            scam.amendment_no, 
                            C.symbol
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CONTRACTS
                    ORDER BY SALES_CONTRACT_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset}
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const salesContracts = result.map(({total_count: _, ...contract}) => {
                    return {
                        ...contract,
                        sales_contract_value: `${currencyFormatter(Number(contract.sales_contract_value), contract.currency_symbol)}`,
                    }
                });

                return { salesContracts, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchSalesContracts: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            try {
                const result = await ctx.db.$queryRaw<SalesContractResponse[]>`
                    WITH CONTRACTS AS (
                        SELECT 
                            SC.ID AS ID,
                            SC.SALES_CONTRACT_NO,
                            SC.SALES_CONTRACT_DATE,
                            SUM(ST.FACTORY_VALUE) AS SALES_CONTRACT_VALUE,
                            F.NAME AS FACTORY_NAME,
                            SC.APPROVAL_STATUS,
                            scam.amendment_no as amendment_no,
                            COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
                            SC.ADDED_AT
                        FROM SALES_CONTRACTS AS SC
                            INNER JOIN FACTORIES AS F ON F.id = SC.factory_id
                            LEFT JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            LEFT JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                            LEFT JOIN factory_orders AS FO ON FO.order_id = BO.id
		                    LEFT JOIN currencies AS C ON C.id = FO.currency_id
                            LEFT JOIN SALES_CONTRACT_AMENDMENT_NO_METADATA AS SCAM ON SCAM.sales_contract_id = SC.id
                            LEFT JOIN (
                                SELECT 
                                    OS.order_id AS ORDER_ID,
                                    SUM(SID.QUANTITY) * FSD.FACTORY_RATE AS FACTORY_VALUE
                                FROM order_styles AS OS 
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                                    LEFT JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                GROUP BY SD.id, OS.order_id, FSD.factory_rate
                            ) ST ON ST.ORDER_ID = SCD.order_id
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
                                WHERE T.BUYER_ID = SC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            SC.SALES_CONTRACT_NO ILIKE '%' || ${input.query} || '%'
                            OR F.NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM sales_contract_details SCD2
                                    JOIN order_styles OS ON OS.order_id = SCD2.order_id
                                    JOIN shipment_details SD ON SD.order_style_id = OS.id
                                    JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                                WHERE SCD2.sales_contract_id = SC.id
                                AND (
                                    OS.style ILIKE '%' || ${input.query} || '%' 
                                    OR SD.buyer_po ILIKE '%' || ${input.query} || '%' 
                                    OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                                )
                            )
                        )
                        GROUP BY SC.ID, 
                            F.NAME, 
                            SC.ADDED_AT, 
                            SC.SALES_CONTRACT_DATE, 
                            SC.APPROVAL_STATUS, 
                            SC.SALES_CONTRACT_NO, 
                            scam.amendment_no, 
                            C.symbol
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CONTRACTS
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const salesContracts = result.map(({total_count: _, ...contract}) => {
                    return {
                        ...contract,
                        sales_contract_value: `${currencyFormatter(Number(contract.sales_contract_value), contract.currency_symbol)}`,
                    }
                });

                return { salesContracts, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteSalesContract: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SALES_CONTRACTS]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete sales contracts."
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const salesContractDetails = await tx.sales_contract_details.findMany({
                        where: {
                            sales_contract_id: input.id,
                        },
                        select: {
                            order_id: true,
                        }
                    });

                    for (const detail of salesContractDetails) {
                        await tx.sales_contract_details_history.create({
                            data: {
                                sales_contract_id: input.id,
                                order_id: detail.order_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    const consignees = await tx.sales_contract_consignees.findMany({
                        where: {
                            sales_contract_id: input.id,
                        },
                        select: {
                            consignee_id: true,
                        }
                    });

                    for (const consignee of consignees) {
                        await tx.sales_contract_consignees_history.create({
                            data: {
                                sales_contract_id: input.id,
                                consignee_id: consignee.consignee_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            }
                        });
                    }

                    await tx.sales_contract_consignees.deleteMany({
                        where: {
                            sales_contract_id: input.id,
                        }
                    });

                    await tx.sales_contract_details.deleteMany({
                        where: {
                            sales_contract_id: input.id,
                        }
                    });

                    // delete amendment number metadata for this sales contract
                    await tx.sales_contract_amendment_no_metadata.delete({
                        where: {
                            sales_contract_id: input.id
                        }
                    })

                    const deletedSalesContract = await tx.sales_contracts.delete({
                        where: {
                            id: input.id,
                        }
                    });

                    await tx.sales_contracts_history.create({
                        data: {
                            sales_contracts_id: deletedSalesContract.id,
                            sales_contract_no: deletedSalesContract.sales_contract_no,
                            sales_contract_date: deletedSalesContract.sales_contract_date,
                            factory_id: deletedSalesContract.factory_id,
                            approval_status: deletedSalesContract.approval_status,
                            company_id: deletedSalesContract.company_id,
                            contact_person_id: deletedSalesContract.contact_person_id,
                            buyer_bank_id: deletedSalesContract.buyer_bank_id,
                            buyer_id: deletedSalesContract.buyer_id,
                            supplier_bank_id: deletedSalesContract.supplier_bank_id,
                            rdl_bank_id: deletedSalesContract.rdl_bank_id,
                            negotiation_bank_id: deletedSalesContract.negotiation_bank_id,
                            partial_shipment: deletedSalesContract.partial_shipment,
                            freight_term_id: deletedSalesContract.freight_term_id,
                            approved_once: deletedSalesContract.approved_once,
                            port_of_loading_id: deletedSalesContract.port_of_loading_id,
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

    createSalesContract: protectedProcedure
        .input(
            z.object({
                buyer_id: z.number(),
                factory_id: z.number(),
                sales_contract_date: z.date(),
                buyer_bank_id: z.number(),
                factory_bank_id: z.number(),
                rdl_bank_id: z.number(),
                negotiation_bank_id: z.number(),
                partial_shipment: z.boolean(),
                destination_id: z.number(),
                freight_terms_id: z.number(),
                consignee_ids: z.array(z.number()),
                company_id: z.number(),
                contact_person_id: z.number(),
                details: z.array(
                    z.object({
                        order_id: z.string(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.SALES_CONTRACTS]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to create sales contracts.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const currentYear = new Date().getFullYear();

                    // Atomic serial generation
                    const metadata = await tx.sales_contract_no_metadata.upsert({
                        where: {
                            year: currentYear,
                        },
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

                    // Parallel lookup queries
                    const [ buyer, factory ] = await Promise.all([
                        tx.buyers.findUnique({
                            where: {
                                id: input.buyer_id,
                            },
                            select: {
                                short_name: true,
                                buyer_name: true,
                            },
                        }),

                        tx.factories.findUnique({
                            where: {
                                id: input.factory_id,
                            },
                            select: {
                                prefix: true,
                                name: true,
                            },
                        }),
                    ]);

                    const buyerPrefix = buyer?.short_name ?? buyer?.buyer_name ?? "UNKNOWN";
5
                    const factoryPrefix = factory?.prefix ?? factory?.name ?? "UNKNOWN";

                    const serial = String(metadata.last_serial).padStart(4, "0");

                    const sales_contract_no = `NEX/SC/${buyerPrefix}/${factoryPrefix}/${currentYear}/${serial}`;

                    // Create SC
                    const newSalesContract = await tx.sales_contracts.create({
                        data: {
                            buyer_id: input.buyer_id,
                            factory_id: input.factory_id,
                            sales_contract_no,
                            sales_contract_date: input.sales_contract_date,
                            buyer_bank_id: input.buyer_bank_id,
                            supplier_bank_id: input.factory_bank_id,
                            rdl_bank_id: input.rdl_bank_id,
                            negotiation_bank_id: input.negotiation_bank_id,
                            partial_shipment: input.partial_shipment,
                            port_of_loading_id: input.destination_id,
                            freight_term_id: input.freight_terms_id,
                            company_id: input.company_id,
                            contact_person_id: input.contact_person_id,
                        },
                    });

                    // Create Consignees
                    if (input.consignee_ids.length > 0) {
                        await tx.sales_contract_consignees.createMany({
                            data: input.consignee_ids.map((consignee_id) => ({
                                sales_contract_id: newSalesContract.id,
                                consignee_id,
                            }))
                        });
                    }

                    // Create SC Details
                    let createdDetails: Awaited<ReturnType<typeof tx.sales_contract_details.findMany>> = [];

                    if (input.details.length > 0) {
                        await tx.sales_contract_details.createMany({
                            data: input.details.map((detail) => ({
                                sales_contract_id: newSalesContract.id,
                                order_id: detail.order_id,
                            })),
                        });

                        createdDetails = await tx.sales_contract_details.findMany({
                            where: {
                                sales_contract_id: newSalesContract.id,
                                order_id: {
                                    in: input.details.map((detail) => detail.order_id),
                                },
                            },
                        });

                        await tx.sales_contract_details_history.createMany({
                            data: createdDetails.map((detail) => ({
                                sales_contract_id: newSalesContract.id,
                                sales_contract_details_id: detail.id,
                                order_id: detail.order_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            })),
                        });
                    }

                    // Initialize amendment metadata
                    await tx.sales_contract_amendment_no_metadata.create({
                        data: {
                            sales_contract_id:
                                newSalesContract.id,
                            amendment_no: 0,
                        },
                    });

                    return {
                        sales_contract: newSalesContract,
                        details: createdDetails,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
        
    getOrderIdForSalesContract: protectedProcedure
        .input(
            z.object({
                buyer_id: z.number(),
                factory_id: z.number(),
                salesContractId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ id: number; ref_no: string; buyer_name: string; season_name: string }[]>`
                    SELECT
                        BO.id AS id,
                        BO.ref_no AS ref_no,
                        B.buyer_name AS buyer_name,
                        S.season_name AS season_name
                    FROM buyer_orders AS BO
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                        INNER JOIN seasons AS S ON S.id = BO.season_id
                        -- INNER JOIN commission_distributions AS CD ON CD.order_id = BO.id
                    WHERE BO.buyer_id = ${input.buyer_id}
                    AND BO.factory_id = ${input.factory_id}
                    AND (
                        NOT EXISTS ( -- Exclude orders already in other sales contracts
                            SELECT 1
                            FROM sales_contract_details AS SCD
                            WHERE SCD.order_id = BO.id
                        )
                        OR EXISTS ( -- Include orders already in the current sales contract
                            SELECT 1
                            FROM sales_contract_details AS SCD
                            WHERE SCD.order_id = BO.id
                            AND SCD.sales_contract_id = ${input.salesContractId}
                        )
                    )
                    -- AND CD.approval_status = TRUE
                    ORDER BY BO.id DESC
                `;

                return orders;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),   
        
    getSalesContractById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyers: {
                            sales_contracts: {
                                some: {
                                    id: input.id,
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                }
            });

            if(!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this sales contract."
                });
            }

            try {
                const salesContractObj = await ctx.db.sales_contracts.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        id: true,
                        sales_contract_no: true,
                        sales_contract_date: true,
                        buyer_id: true,
                        factory_id: true,
                        buyer_bank_id: true,
                        supplier_bank_id: true,
                        rdl_bank_id: true,
                        negotiation_bank_id: true,
                        partial_shipment: true,
                        port_of_loading_id: true,
                        freight_term_id: true,
                        company_id: true,
                        contact_person_id: true,
                        sales_contract_details: {
                            select: {
                                id: true,
                                order_id: true,
                                buyer_orders: {
                                    select: {
                                        ref_no: true,
                                        buyers: {
                                            select: { buyer_name: true } 
                                        },
                                        seasons: {
                                            select: { season_name: true }
                                        }
                                    }
                                }
                            }
                        },
                        sales_contract_consignees: {
                            select: {
                                consignee_id: true,
                                buyer_consignee: {
                                    select: { consignee_name: true } 
                                }
                            }
                       }
                    }
                });

                const salesContract = {
                    ...salesContractObj,
                    freight_terms_id: salesContractObj?.freight_term_id,
                    factory_bank_id: salesContractObj?.supplier_bank_id,
                    destination_id: salesContractObj?.port_of_loading_id,
                    details: salesContractObj?.sales_contract_details.map(detail => ({
                        id: detail.id,
                        ref_no: detail.buyer_orders?.ref_no ?? '',
                        order_id: detail.order_id,
                        buyer_name: detail.buyer_orders?.buyers?.buyer_name ?? '',
                        season_name: detail.buyer_orders?.seasons?.season_name ?? '',
                    })) ?? [],
                    consignee_ids: salesContractObj?.sales_contract_consignees.map(c => c.consignee_id?.toString()) ?? [],
                    sales_contract_details: undefined,
                    sales_contract_consignees: undefined,
                };

                return salesContract;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateSalesContract: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                buyer_id: z.number(),
                factory_id: z.number(),
                sales_contract_date: z.date(),
                buyer_bank_id: z.number(),
                factory_bank_id: z.number(),
                rdl_bank_id: z.number(),
                negotiation_bank_id: z.number(),
                partial_shipment: z.boolean(),
                destination_id: z.number(),
                freight_terms_id: z.number(),
                consignee_ids: z.array(z.number()),
                company_id: z.number(),
                contact_person_id: z.number(),
                details: z.array(z.object({
                    id: z.string().optional(),
                    order_id: z.string(),
                })),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const can_edit = ctx.permissions[m.SALES_CONTRACTS]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to edit sales contracts.",
                    });
                }

                const salesContract = await ctx.db.sales_contracts.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        approval_status: true,
                        sales_contract_no: true,
                    },
                });

                if (!salesContract) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Sales contract not found.",
                    });
                }

                if (salesContract.approval_status === 2) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Approved sales contracts cannot be edited.",
                    });
                }

                const isATeamMember = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        teams: {
                            buyers: {
                                sales_contracts: {
                                    some: {
                                        id: input.id,
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                });

                if (!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view this sales contract.",
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const updatedSalesContract = await tx.sales_contracts.update({
                        where: { id: input.id },
                        data: {
                            buyer_id: input.buyer_id,
                            factory_id: input.factory_id,
                            sales_contract_date: input.sales_contract_date,
                            buyer_bank_id: input.buyer_bank_id,
                            supplier_bank_id: input.factory_bank_id,
                            rdl_bank_id: input.rdl_bank_id,
                            negotiation_bank_id: input.negotiation_bank_id,
                            partial_shipment: input.partial_shipment,
                            port_of_loading_id: input.destination_id,
                            freight_term_id: input.freight_terms_id,
                            company_id: input.company_id,
                            contact_person_id: input.contact_person_id,
                        },
                    });

                    await tx.sales_contracts_history.create({
                        data: {
                            sales_contracts_id: input.id,
                            buyer_id: input.buyer_id,
                            sales_contract_no: salesContract.sales_contract_no,
                            factory_id: input.factory_id,
                            sales_contract_date: input.sales_contract_date,
                            buyer_bank_id: input.buyer_bank_id,
                            supplier_bank_id: input.factory_bank_id,
                            rdl_bank_id: input.rdl_bank_id,
                            negotiation_bank_id: input.negotiation_bank_id,
                            partial_shipment: input.partial_shipment,
                            port_of_loading_id: input.destination_id,
                            freight_term_id: input.freight_terms_id,
                            company_id: input.company_id,
                            contact_person_id: input.contact_person_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    // CONSIGNEES

                    const existingConsignees = await tx.sales_contract_consignees.findMany({
                        where: {
                            sales_contract_id: input.id,
                        },
                        select: {
                            id: true,
                            consignee_id: true,
                        },
                    });

                    const existingConsigneeIds = new Set(
                        existingConsignees.map(c => c.consignee_id)
                    );

                    const inputConsigneeIds = new Set(input.consignee_ids);

                    const consigneesToAdd = input.consignee_ids.filter(
                        id => !existingConsigneeIds.has(id)
                    );

                    const consigneesToDelete = existingConsignees.filter(
                        consignee => consignee.consignee_id !== null && !inputConsigneeIds.has(consignee.consignee_id)
                    );

                    if (consigneesToAdd.length > 0) {
                        await tx.sales_contract_consignees.createMany({
                            data: consigneesToAdd.map(consignee_id => ({
                                sales_contract_id: input.id,
                                consignee_id,
                            })),
                        });

                        await tx.sales_contract_consignees_history.createMany({
                            data: consigneesToAdd.map(consignee_id => ({
                                sales_contract_id: input.id,
                                consignee_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            })),
                        });
                    }

                    if (consigneesToDelete.length > 0) {
                        await tx.sales_contract_consignees_history.createMany({
                            data: consigneesToDelete.map(consignee => ({
                                sales_contract_id: input.id,
                                consignee_id: consignee.consignee_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        });

                        await tx.sales_contract_consignees.deleteMany({
                            where: {
                                id: {
                                    in: consigneesToDelete.map(c => c.id),
                                },
                            },
                        });
                    }

                    // DETAILS
                    const existingDetails = await tx.sales_contract_details.findMany({
                        where: {
                            sales_contract_id: input.id,
                        },
                        select: {
                            id: true,
                            order_id: true,
                        },
                    });

                    const existingOrderIds = new Set(
                        existingDetails.map(detail => detail.order_id)
                    );

                    const inputOrderIds = new Set(
                        input.details.map(detail => detail.order_id)
                    );

                    const detailsToAdd = input.details.filter(
                        detail => !existingOrderIds.has(detail.order_id)
                    );

                    const detailsToDelete = existingDetails.filter(
                        detail => !inputOrderIds.has(detail.order_id)
                    );

                    let createdDetails: Awaited<
                        ReturnType<typeof tx.sales_contract_details.findMany>
                    > = [];

                    if (detailsToAdd.length > 0) {
                        await tx.sales_contract_details.createMany({
                            data: detailsToAdd.map(detail => ({
                                sales_contract_id: input.id,
                                order_id: detail.order_id,
                            })),
                        });

                        createdDetails = await tx.sales_contract_details.findMany({
                            where: {
                                sales_contract_id: input.id,
                                order_id: {
                                    in: detailsToAdd.map(detail => detail.order_id),
                                },
                            },
                        });

                        await tx.sales_contract_details_history.createMany({
                            data: createdDetails.map(detail => ({
                                sales_contract_id: input.id,
                                sales_contract_details_id: detail.id,
                                order_id: detail.order_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            })),
                        });
                    }

                    if (detailsToDelete.length > 0) {
                        await tx.sales_contract_details_history.createMany({
                            data: detailsToDelete.map(detail => ({
                                sales_contract_id: input.id,
                                sales_contract_details_id: detail.id,
                                order_id: detail.order_id,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            })),
                        });

                        await tx.sales_contract_details.deleteMany({
                            where: {
                                id: {
                                    in: detailsToDelete.map(detail => detail.id),
                                },
                            },
                        });
                    }

                    return {
                        sales_contract: updatedSalesContract,
                        added_details: createdDetails,
                        deleted_details: detailsToDelete,
                    };
                }, {timeout: 30000});
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteSalesContractDetail: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SALES_CONTRACTS]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete sales contract details."
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const isApproved = await tx.sales_contract_details.findUnique({
                        where: {
                            id: input.id,
                        },
                        select: {
                            sales_contracts: {
                                select: {
                                    approval_status: true,
                                }
                            }
                        }
                    });

                    if(isApproved?.sales_contracts?.approval_status === 2) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "Cannot delete details from an approved sales contract.",
                        });
                    }

                    const detailToDelete = await tx.sales_contract_details.findUnique({
                        where: {
                            id: input.id,
                        },
                        select: {
                            sales_contract_id: true,
                            order_id: true,
                        }
                    });

                    if (!detailToDelete) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Sales contract detail not found.",
                        });
                    }

                    await tx.sales_contract_details.delete({
                        where: {
                            id: input.id,
                        }
                    });

                    await tx.sales_contract_details_history.create({
                        data: {
                            sales_contract_id: detailToDelete.sales_contract_id,
                            order_id: detailToDelete.order_id,
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
            id: z.string()
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view authorizations." 
                });
            }

            try {
                const authorizationState = await ctx.db.sales_contracts.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        approval_status: true,
                        approved_once: true,
                    }
                });

                if (!authorizationState) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Sales contract not found.",
                    });
                }

                // Get the user's authorization permission for factory orders
                const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number, approval_level: number}[]>`
                    SELECT 
                        department_id, level_id, approval_level
                    FROM AUTHORIZATIONS 
                    WHERE module_id = ${m.SALES_CONTRACTS}
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


    approveSalesContract: protectedProcedure
        .input(z.object({
            id: z.string(),
            approval_status: z.number().max(2).min(0),
            previous_approval_status: z.number()
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to approve sales contracts." 
                });
            }

            try {
                await ctx.db.$transaction(async (tx) => {
                    const existingSalesContract = await tx.sales_contracts.findUnique({
                        where: {
                            id: input.id,
                        },
                        select: {
                            id: true,
                            approval_status: true,
                            approved_once: true,
                        }
                    });

                    if (!existingSalesContract) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Sales contract not found.",
                        });
                    }

                    if(existingSalesContract.approval_status !== input.previous_approval_status) {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: "Sales contract approval status has been changed by another user. Try again.",
                        });
                    }

                    const authorizationPermission = await ctx.db.$queryRaw<{department_id: number, level_id: number, approval_level: number}[]>`
                        SELECT 
                            department_id, level_id, approval_level
                        FROM AUTHORIZATIONS 
                        WHERE module_id = ${m.SALES_CONTRACTS}
                            AND level_id = ${ctx.user.level_id}
                            AND department_id = ${ctx.user.department_id}
                        LIMIT 1;
                    `;

                    if (existingSalesContract.approval_status === 0 && input.approval_status === 2) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Sales contract is not submitted yet.",
                        });
                    }
                    else if(authorizationPermission?.[0]?.approval_level === 1 && input.approval_status === 2) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You do not have permission to approve this sales contract.",
                        });
                    }
                    else if(authorizationPermission?.[0]?.approval_level === 1 && input.approval_status === 0 && existingSalesContract.approval_status === 2) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You do not have permission to Unauthorize Authorized Sales Contract.",
                        });
                    }
                    else {
                        await tx.sales_contracts.update({
                            where: {
                                id: input.id,
                            },
                            data: {
                                approval_status: input.approval_status,
                                approved_once: existingSalesContract.approved_once || input.approval_status === 2 ? true : false,
                            }
                        });
                    }
                }, {timeout: 30000})
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
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts." 
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyers: {
                            sales_contracts: {
                                some: {
                                    id: input.id,
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                }
            });

            if(!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this sales contract." 
                });
            }

            try {
                const pdfHeaderData = await ctx.db.$queryRaw<SalesContractPDFHeaderData[]>`
                    SELECT 
                        SC.SALES_CONTRACT_NO AS SALES_CONTRACT_NO,
                        SC.SALES_CONTRACT_DATE AS SALES_CONTRACT_DATE,
                        B.BUYER_NAME AS BUYER_NAME,
                        B.ADDRESS AS BUYER_ADDRESS,
                        B_BUY.NAME AS BUYER_BANK_NAME,
                        BB.BRANCH_NAME AS BUYER_BANK_BRANCH,
                        BB.ACCOUNT_NO AS BUYER_BANK_ACCOUNT_NO,
                        BB.ACCOUNT_NAME AS BUYER_BANK_ACCOUNT_NAME,
                        BB.SWIFT AS BUYER_BANK_SWIFT,
                        BB.ADDRESS AS BUYER_BANK_ADDRESS,
                        F.NAME AS FACTORY_NAME,
                        F.FACTORY_ADDRESS AS FACTORY_ADDRESS,
                        B_FAC.NAME AS FACTORY_BANK_NAME,
                        FB.BRANCH_NAME AS FACTORY_BANK_BRANCH,
                        FB.ACCOUNT_NO AS FACTORY_BANK_ACCOUNT_NO,
                        FB.ACCOUNT_NAME AS FACTORY_BANK_ACCOUNT_NAME,
                        FB.SWIFT_CODE AS FACTORY_BANK_SWIFT,
                        FB.ADDRESS AS FACTORY_BANK_ADDRESS,
                        C.NAME AS COMPANY_NAME,
                        CONCAT(C.STREET, ', ', C.CITY) AS COMPANY_ADDRESS,
                        B_COM.NAME AS COMPANY_BANK,
                        CB.BRANCH_NAME AS COMPANY_BANK_BRANCH,
                        CB.ACCOUNT_NO AS COMPANY_BANK_ACCOUNT_NO,
                        CB.ACCOUNT_NAME AS COMPANY_BANK_ACCOUNT_NAME,
                        CB.SWIFT AS COMPANY_BANK_SWIFT,
                        CB.ADDRESS AS COMPANY_BANK_ADDRESS,
                        B_NEG.NAME AS NEGOTIATION_BANK,
                        NB.BRANCH_NAME AS NEGOTIATION_BANK_BRANCH,
                        NB.ACCOUNT_NO AS NEGOTIATION_BANK_ACCOUNT_NO,
                        NB.ACCOUNT_NAME AS NEGOTIATION_BANK_ACCOUNT_NAME,
                        NB.SWIFT AS NEGOTIATION_BANK_SWIFT,
                        NB.ADDRESS AS NEGOTIATION_BANK_ADDRESS,
                        SCCP.NAME AS CONTACT_PERSON,
                        SCCP.CONTACT_NUMBER AS CONTACT_NUMBER,
                        SCCP.PABX AS CONTACT_PERSON_PABX,
                        SCCP.EXT AS CONTACT_PERSON_EXT,
                        SCCP.EMAIL AS CONTACT_PERSON_EMAIL,
                        PO.PAYMENT_TERM AS PAYMENT_TERMS,
                        PO.LAST_SHIPMENT_DATE AS LAST_SHIPMENT_DATE,
                        PO.EXPIRY_DATE AS EXPIRY_DATE,
                        PO.FINAL_DESTINATION AS FINAL_DESTINATION,
                        SC.partial_shipment AS PARTIAL_SHIPMENT_ALLOWED,
                        FT.name AS FREIGHT_TERM,
                        D.NAME AS PORT_OF_LOADING,
                        SC.approval_status AS APPROVAL_STATUS
                    FROM sales_contracts AS SC
                        INNER JOIN buyers AS B ON SC.buyer_id = B.id
                        INNER JOIN buyer_banks AS BB ON BB.id = SC.buyer_bank_id
                        INNER JOIN BANKS AS B_BUY ON BB.bank_id = B_BUY.id
                        INNER JOIN factories AS F ON F.id = SC.factory_id
                        INNER JOIN factory_bank AS FB ON FB.id = SC.supplier_bank_id
                        INNER JOIN BANKS AS B_FAC ON FB.bank_id = B_FAC.id
                        INNER JOIN companies AS C ON C.id = SC.company_id
                        INNER JOIN company_banks AS CB ON CB.id = SC.rdl_bank_id
                        INNER JOIN BANKS AS B_COM ON CB.bank_id = B_COM.id
                        INNER JOIN sales_contract_contact_person AS SCCP ON SCCP.id = SC.contact_person_id
                        INNER JOIN destinations AS D ON D.ID = SC.port_of_loading_id
                        INNER JOIN company_banks AS NB ON NB.id = SC.negotiation_bank_id
                        INNER JOIN BANKS AS B_NEG ON NB.bank_id = B_NEG.id
                        INNER JOIN freight_term AS FT ON FT.id = SC.freight_term_id
                        INNER JOIN (
                            SELECT 
                                SCD.SALES_CONTRACT_ID,
                                STRING_AGG(DISTINCT P.TERM, ', ') AS PAYMENT_TERM,
                                MAX(FSD.EXFACTORY_DATE) AS LAST_SHIPMENT_DATE,
                                MAX(FSD.EXFACTORY_DATE) + INTERVAL '15 days' AS EXPIRY_DATE,
                                STRING_AGG(DISTINCT D.NAME, ', ') AS FINAL_DESTINATION
                            FROM buyer_orders AS BO
                                INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                                INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                INNER JOIN sales_contract_details AS SCD ON SCD.order_id = BO.id
                                INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                                INNER JOIN destinations AS D ON D.id = SD.destination_id
                                JOIN (
                                    SELECT 
                                        PT.ID AS ID,
                                        CONCAT(T.NAME, ' ', PT.TENOR, ' DAYS ', PT.TERM_DESCRIPTION) AS TERM
                                    FROM payment_terms AS PT
                                        INNER JOIN terms AS T ON T.id = PT.term_id
                                ) P ON P.id = SD.payment_term_id
                            GROUP BY SCD.sales_contract_id
                        ) PO ON PO.SALES_CONTRACT_ID = SC.ID
                    WHERE SC.ID = ${input.id};
                `;

                const amendmentData = await ctx.db.$queryRaw<{amendment_date: Date, amendment_no: number}[]>`
                    SELECT 
                        SCA.amendment_date,
                        MAX(SCAM.amendment_no) AS amendment_no
                    FROM sales_contract_amendment AS SCA
                    JOIN sales_contract_amendment_no_metadata AS SCAM 
                        ON SCAM.sales_contract_id = SCA.sales_contract_id
                    WHERE SCA.sales_contract_id = ${input.id}
                    AND SCA.amendment_date = (
                        SELECT MAX(amendment_date)
                        FROM sales_contract_amendment
                        WHERE sales_contract_id = SCA.sales_contract_id
                    )
                    GROUP BY SCA.amendment_date;
                `;

                const consigneeData = await ctx.db.$queryRaw<{consignee_name: string, consignee_address: string}[]>`
                    SELECT
                        BC.consignee_name AS CONSIGNEE_NAME,
                        BC.ADDRESS AS CONSIGNEE_ADDRESS
                    FROM SALES_CONTRACT_CONSIGNEES AS SCC
                        INNER JOIN BUYER_CONSIGNEE AS BC ON BC.ID = SCC.consignee_id
                    WHERE SCC.sales_contract_id = ${input.id}
                    ORDER BY BC.sl_no;
                `;

                const latePolicies = await ctx.db.$queryRaw<{late_policy: string}[]>`
                    SELECT 
                        BLP.DESCRIPTION AS LATE_POLICY
                    FROM sales_contracts AS SC
                        INNER JOIN BUYERS AS B ON B.id = SC.buyer_id
                        INNER JOIN buyer_late_policies AS BLP ON BLP.buyer_id = B.id
                    WHERE SC.ID = ${input.id}
                    ORDER BY BLP.sl_no;
                `;

                const additionalClauses = await ctx.db.$queryRaw<{additional_clause: string}[]>`
                    SELECT 
                        BAC.description AS ADDITIONAL_CLAUSE
                    FROM sales_contracts AS SC
                        INNER JOIN BUYERS AS B ON B.id = SC.buyer_id
                        INNER JOIN BUYER_ADDITIONAL_CLAUSE AS BAC ON BAC.buyer_id = B.id
                    WHERE SC.ID = ${input.id}
                    ORDER BY BAC.sl_no;
                `;

                const orderDataObj = await ctx.db.sales_contracts.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        sales_contract_details: {
                            select: {
                                buyer_orders: {
                                    select: {
                                        ref_no: true,
                                        order_styles: {
                                            select: {
                                                style: true,
                                                products: {
                                                    select: {
                                                        name: true,
                                                    }
                                                },
                                                shipment_details: {
                                                    select: {
                                                        buyer_po: true,
                                                        shipment_item_details: {
                                                            select: {
                                                                quantity: true,
                                                                colors: {
                                                                    select: {
                                                                        name: true,
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        factory_shipment_details: {
                                                            select: {
                                                                exfactory_date: true,
                                                                factory_rate: true,
                                                                transfer_rate: true,
                                                                factory_orders: {
                                                                    select: {
                                                                        currencies: {
                                                                            select: {
                                                                                symbol: true,
                                                                                name: true,
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        destinations: {
                                                            select: {
                                                                name: true,
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                const currencySymbol = orderDataObj?.sales_contract_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.symbol ?? '$';
                const currencyName = orderDataObj?.sales_contract_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.name ?? 'USD';

                const orderData = orderDataObj?.sales_contract_details.map(detail => ({
                    ref_no: detail.buyer_orders?.ref_no,
                    shipment_details: detail.buyer_orders?.order_styles.flatMap(os =>
                        os.shipment_details.map(sd => ({
                            style: os.style,
                            description: os.products.name,
                            buyer_po: sd.buyer_po,
                            quantity: quantityFormatter(
                                sd.shipment_item_details.reduce((sum, item) => sum + item.quantity, 0)
                            ),
                            colors: formatColorQty(sd.shipment_item_details),
                            exfactory_date: formatDate(sd.factory_shipment_details?.[0]?.exfactory_date ?? ''),
                            transfer_rate: (sd.factory_shipment_details?.[0]?.transfer_rate ?? 0) > 0
                                    ? sd.factory_shipment_details?.[0]?.transfer_rate
                                    : sd.factory_shipment_details?.[0]?.factory_rate,
                            price: currencyFormatter(
                                (
                                    ((sd.factory_shipment_details?.[0]?.transfer_rate ?? 0) > 0
                                        ? sd.factory_shipment_details?.[0]?.transfer_rate
                                        : sd.factory_shipment_details?.[0]?.factory_rate) ?? 0
                                ) *
                                sd.shipment_item_details.reduce((sum, item) => sum + item.quantity, 0),
                                currencySymbol
                            ),
                            destination: sd.destinations?.name,
                        }))
                    ),
                    results: {
                        totalQuantity: quantityFormatter(
                            detail.buyer_orders?.order_styles.reduce((sumOs, os) => 
                                sumOs + os.shipment_details.reduce((sumSd, sd) =>
                                    sumSd + sd.shipment_item_details.reduce((sumItem, item) => sumItem + item.quantity, 0),
                                0),
                            0)
                        ),
                        totalValue: currencyFormatter(
                            detail.buyer_orders?.order_styles.reduce((sumOs, os) =>
                                sumOs + os.shipment_details.reduce((sumSd, sd) =>
                                    sumSd + (
                                        ((sd.factory_shipment_details?.[0]?.transfer_rate ?? 0) > 0
                                            ? sd.factory_shipment_details?.[0]?.transfer_rate
                                            : sd.factory_shipment_details?.[0]?.factory_rate) ?? 0
                                    ) *
                                    sd.shipment_item_details.reduce((sumItem, item) => sumItem + item.quantity, 0), 
                                0), 
                            0),
                            currencySymbol
                        ),
                    }
                })) ?? [];

                const totalQuantity = quantityFormatter(
                    orderDataObj?.sales_contract_details.reduce((sumDetail, detail) =>
                        sumDetail + detail.buyer_orders?.order_styles.reduce((sumOs, os) => 
                            sumOs + os.shipment_details.reduce((sumSd, sd) =>
                                sumSd + sd.shipment_item_details.reduce((sumItem, item) => sumItem + item.quantity, 0),
                            0), 
                        0), 
                    0) ?? 0
                );

                const totalValue = orderDataObj?.sales_contract_details.reduce(
                    (sumDetail, detail) =>
                        sumDetail + detail.buyer_orders?.order_styles.reduce((sumOs, os) =>
                            sumOs + os.shipment_details.reduce((sumSd, sd) =>
                                sumSd + (
                                    ((sd.factory_shipment_details?.[0]?.transfer_rate ?? 0) > 0
                                        ? sd.factory_shipment_details?.[0]?.transfer_rate
                                        : sd.factory_shipment_details?.[0]?.factory_rate) ?? 0
                                ) *
                                sd.shipment_item_details.reduce((sumItem, item) => sumItem + item.quantity, 0), 
                            0), 
                        0), 
                    0) ?? 0;

                const totalValueString = currencyFormatter(totalValue,currencySymbol);

                const totalValueInWord = amountToWords(totalValue);

                return { 
                    pdfHeaderData: pdfHeaderData[0], 
                    amendmentData: amendmentData[0], 
                    consigneeData: consigneeData, 
                    orderData: orderData,
                    latePolicies: latePolicies,
                    additionalClauses: additionalClauses,
                    totals: {
                        totalQuantity,
                        totalValue: totalValueString,
                        totalValueInWord,
                        currencyName,
                    }
                }
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getUnauthorizedCommissionDistributions: protectedProcedure
        .input(z.object({
            sales_contract_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distributions." 
                });
            }

            try {
                const distributions = await ctx.db.$queryRaw<{all_approved: boolean, failed_ref_nos: string}[]>`
                    SELECT 
                        BOOL_AND(CD.approval_status) AS all_approved,
                        STRING_AGG(DISTINCT BO.ref_no, ', ') 
                            FILTER (WHERE CD.approval_status = FALSE) AS failed_ref_nos
                    FROM sales_contracts AS SC
                    INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                    INNER JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                    INNER JOIN commission_distributions AS CD ON CD.order_id = BO.id
                    WHERE SC.ID = ${input.sales_contract_id};
                `;

                return distributions[0];
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    getSalesContractCommissionPDFData: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view commission distribution data." 
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyers: {
                            sales_contracts: {
                                some: {
                                    id: input.id,
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                }
            });

            if(!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this sales contract." 
                });
            }

            try {
                const pdfHeader = await ctx.db.sales_contracts.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        sales_contract_no: true,
                        sales_contract_date: true,
                        buyers: {
                            select: {
                                buyer_name: true,
                            }
                        }
                    }
                });

                const hasAmendment = await ctx.db.sales_contract_amendment.findFirst({
                    where: {
                        sales_contract_id: input.id,
                    },
                    select: {
                        id: true,
                    }
                });

                let nonAmendData = null;
                let amendData = null;

                if(!hasAmendment) {
                    const orderDataObj = await ctx.db.sales_contracts.findUnique({
                        where: {
                            id: input.id,
                        },
                        select: {
                            sales_contract_details: {
                                select: {
                                    buyer_orders: {
                                        select: {
                                            ref_no: true,
                                            order_styles: {
                                                orderBy: {
                                                    serial: 'asc'
                                                },
                                                select: {
                                                    style: true,
                                                    shipment_details: {
                                                        orderBy: {
                                                            serial: 'asc'
                                                        },
                                                        select: {
                                                            buyer_po: true,
                                                            fob_rate: true,
                                                            shipment_item_details: {
                                                                select: {
                                                                    quantity: true,
                                                                }
                                                            },
                                                            factory_shipment_details: {
                                                                select: {
                                                                    factory_rate: true,
                                                                    factory_orders: {
                                                                    select: {
                                                                        currencies: {
                                                                            select: {
                                                                                symbol: true,
                                                                                name: true,
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                }
                                                            },
                                                            commission_distributions_details: {
                                                                select: {
                                                                    dhaka_commission_percentage: true,
                                                                    overseas_commission_percentage: true,
                                                                    others_commission_percentage: true,
                                                                }
                                                            }
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

                        
                    const currencySymbol =
                        orderDataObj?.sales_contract_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.symbol ??
                        '$';

                    nonAmendData = orderDataObj?.sales_contract_details?.map(detail => {
                        const shipmentRows = detail.buyer_orders?.order_styles?.flatMap(os =>
                            os.shipment_details?.map(sd => {
                                const totalQty = sd.shipment_item_details?.reduce(
                                    (sum, item) => sum + (item.quantity ?? 0), 0
                                ) ?? 0;

                                const fobRate = sd.fob_rate ?? 0;
                                const factoryRate = sd.factory_shipment_details?.[0]?.factory_rate ?? 0;

                                const rdlVal = totalQty * fobRate;
                                const factoryVal = totalQty * factoryRate;
                                const commVal = rdlVal - factoryVal;

                                const dhakaComm = (rdlVal * (sd.commission_distributions_details?.dhaka_commission_percentage ?? 0)) / 100;

                                const overseasComm =(rdlVal * (sd.commission_distributions_details?.overseas_commission_percentage ?? 0)) /100;

                                const othersComm =(rdlVal * (sd.commission_distributions_details?.others_commission_percentage ?? 0)) /100;
                                        
                                return {
                                    row: {
                                        style: os.style,
                                        buyer_po: sd.buyer_po,
                                        quantity: quantityFormatter(totalQty),
                                        fob_rate: currencyFormatter(fobRate, currencySymbol),
                                        rdl_value: currencyFormatter(rdlVal, currencySymbol),
                                        factory_rate: currencyFormatter(factoryRate, currencySymbol),
                                        factory_value: currencyFormatter(factoryVal, currencySymbol),
                                        commissionPercentage: `${rdlVal ? ((commVal / rdlVal) * 100).toFixed(2) : '0.00'}%`,
                                        commissionValue: currencyFormatter(commVal, currencySymbol),
                                        dhakaCommission: currencyFormatter(dhakaComm, currencySymbol),
                                        overseasCommission: currencyFormatter(overseasComm, currencySymbol),
                                        othersCommission: currencyFormatter(othersComm, currencySymbol),
                                    },

                                    raw: {
                                        totalQty,
                                        rdlVal,
                                        factoryVal,
                                        commVal,
                                        dhakaComm,
                                        overseasComm,
                                        othersComm,
                                    },
                                };
                            }) || []
                        ) || [];

                    const totals = shipmentRows.reduce(
                        (acc, item) => {
                            acc.qty += item.raw.totalQty;
                            acc.rdl += item.raw.rdlVal;
                            acc.factory += item.raw.factoryVal;
                            acc.comm += item.raw.commVal;
                            acc.dhaka += item.raw.dhakaComm;
                            acc.overseas += item.raw.overseasComm;
                            acc.others += item.raw.othersComm;
                            return acc;
                        },
                        {
                            qty: 0,
                            rdl: 0,
                            factory: 0,
                            comm: 0,
                            dhaka: 0,
                            overseas: 0,
                            others: 0,
                        }
                    );

                    return {
                        ref_no: detail.buyer_orders?.ref_no,

                        shipment_details: shipmentRows.map(item => item.row),

                        results: {
                            totalQuantity: quantityFormatter(totals.qty),
                                totalRdlValue: currencyFormatter(totals.rdl,currencySymbol),
                                totalFactoryValue: currencyFormatter(totals.factory,currencySymbol),
                                commissionPercentage: `${totals.rdl? ((totals.comm / totals.rdl) * 100).toFixed(2) : '0.00'}%`,
                                totalCommissionValue: currencyFormatter(totals.comm,currencySymbol),
                                totalDhakaCommission: currencyFormatter(totals.dhaka,currencySymbol),
                                totalDhakaCommissionPercentage: `${totals.rdl? ((totals.dhaka / totals.rdl) * 100).toFixed(2) : '0.00'}%`,
                                totalOverseasCommission: currencyFormatter(totals.overseas,currencySymbol),
                                totalOverseasCommissionPercentage: `${totals.rdl? ((totals.overseas / totals.rdl) * 100).toFixed(2) : '0.00'}%`,
                                totalOthersCommission: currencyFormatter(totals.others,currencySymbol),
                                totalOthersCommissionPercentage: `${totals.rdl? ((totals.others / totals.rdl) * 100).toFixed(2) : '0.00'}%`,
                            },
                        };
                    }) || [];
                }
                else {
                    const orderDataObj = await ctx.db.sales_contract_amendment.findMany({
                        where: {
                            sales_contract_id: input.id,
                        },
                        select: {
                            amendment_no: true,
                            amendment_date: true,
                            sales_contract_amendment_details: {
                                select: {
                                    buyer_orders: {
                                        select: {
                                            ref_no: true,
                                            order_styles: {
                                                orderBy: {
                                                    serial: 'asc'
                                                },
                                                select: {
                                                    style: true,
                                                    shipment_details: {
                                                        orderBy: {
                                                            serial: 'asc'
                                                        },
                                                        select: {
                                                            buyer_po: true,
                                                            fob_rate: true,
                                                            shipment_item_details: {
                                                                select: {
                                                                    quantity: true,
                                                                }
                                                            },
                                                            factory_shipment_details: {
                                                                select: {
                                                                    factory_rate: true,
                                                                    factory_orders: {
                                                                    select: {
                                                                        currencies: {
                                                                            select: {
                                                                                symbol: true,
                                                                                name: true,
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                }
                                                            },
                                                            commission_distributions_details: {
                                                                select: {
                                                                    dhaka_commission_percentage: true,
                                                                    overseas_commission_percentage: true,
                                                                    others_commission_percentage: true,
                                                                }
                                                            }
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

                    const currencySymbol = orderDataObj?.[0]?.sales_contract_amendment_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.symbol ?? '$';

                    amendData = orderDataObj.map(amendment => {
                        const shipmentRows = amendment.sales_contract_amendment_details.flatMap(detail =>
                            detail.buyer_orders?.order_styles.flatMap(os =>
                                os.shipment_details.map(sd => {
                                    const totalQty = sd.shipment_item_details.reduce(
                                        (sum, item) => sum + (item.quantity ?? 0), 0
                                    );

                                    const fobRate = sd.fob_rate ?? 0;
                                    const factoryRate = sd.factory_shipment_details?.[0]?.factory_rate ?? 0;

                                    const rdlVal = totalQty * fobRate;
                                    const factoryVal = totalQty * factoryRate;
                                    const commVal = rdlVal - factoryVal;

                                    const dhakaComm = rdlVal * (sd.commission_distributions_details?.dhaka_commission_percentage ?? 0) / 100;

                                    const overseasComm = rdlVal * (sd.commission_distributions_details?.overseas_commission_percentage ?? 0) / 100;

                                    const othersComm = rdlVal * (sd.commission_distributions_details?.others_commission_percentage ?? 0) / 100;

                                    return {
                                        row: {
                                            style: os.style,
                                            buyer_po: sd.buyer_po,
                                            quantity: quantityFormatter(totalQty),
                                            fob_rate: currencyFormatter(fobRate, currencySymbol),
                                            rdl_value: currencyFormatter(rdlVal, currencySymbol),
                                            factory_rate: currencyFormatter(factoryRate, currencySymbol),
                                            factory_value: currencyFormatter(factoryVal, currencySymbol),
                                            commissionPercentage: `${rdlVal ? ((commVal / rdlVal) * 100).toFixed(2) : "0.00"}%`,
                                            commissionValue: currencyFormatter(commVal, currencySymbol),
                                            dhakaCommission: currencyFormatter(dhakaComm, currencySymbol),
                                            overseasCommission: currencyFormatter(overseasComm, currencySymbol),
                                            othersCommission: currencyFormatter(othersComm, currencySymbol),
                                        },

                                        raw: { totalQty, rdlVal, factoryVal, commVal, dhakaComm, overseasComm, othersComm },
                                    };
                                })
                            ) || []
                        );

                        const totals = shipmentRows.reduce(
                            (acc, item) => {
                                acc.qty += item.raw.totalQty;
                                acc.rdl += item.raw.rdlVal;
                                acc.factory += item.raw.factoryVal;
                                acc.comm += item.raw.commVal;
                                acc.dhaka += item.raw.dhakaComm;
                                acc.overseas += item.raw.overseasComm;
                                acc.others += item.raw.othersComm;

                                return acc;
                            },
                            {
                                qty: 0,
                                rdl: 0,
                                factory: 0,
                                comm: 0,
                                dhaka: 0,
                                overseas: 0,
                                others: 0,
                            }
                        );

                        return {
                            amendment_no: amendment.amendment_no,
                            amendment_date: amendment.amendment_date,
                            ref_no: amendment.sales_contract_amendment_details?.[0]?.buyer_orders?.ref_no,
                            shipment_details: shipmentRows.map(item => item.row),
                            results: {
                                totalQuantity: quantityFormatter(totals.qty),
                                totalRdlValue: currencyFormatter( totals.rdl, currencySymbol),
                                totalFactoryValue: currencyFormatter( totals.factory, currencySymbol),
                                commissionPercentage: `${totals.rdl ? ((totals.comm / totals.rdl) * 100).toFixed(2) : "0.00"}%`,
                                totalCommissionValue: currencyFormatter(totals.comm,currencySymbol),
                                totalDhakaCommission: currencyFormatter(totals.dhaka,currencySymbol),
                                totalDhakaCommissionPercentage: `${totals.rdl ? ((totals.dhaka / totals.rdl) * 100).toFixed(2) : "0.00" }%`,
                                totalOverseasCommission: currencyFormatter(totals.overseas,currencySymbol),
                                totalOverseasCommissionPercentage: `${ totals.rdl ? ((totals.overseas / totals.rdl) * 100).toFixed(2) : "0.00" }%`,
                                totalOthersCommission: currencyFormatter(totals.others,currencySymbol),
                                totalOthersCommissionPercentage: `${ totals.rdl ? ((totals.others / totals.rdl) * 100).toFixed(2) : "0.00"}%`,
                            },
                        };
                    });
                }

                return { pdfHeader, hasAmendment: !!hasAmendment, amendData, nonAmendData };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});