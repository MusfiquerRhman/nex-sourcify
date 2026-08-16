import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { amountToWords, currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { formatColorQty } from "./salesContracts";
import { formatDate } from "~/utils/localDateString";
import type { SalesContractPDFHeaderData } from "./_types/salesContract";

type SalesContract = {
    id: string;
    sales_contract_no: string;
    sales_contract_date: Date;
    amendment_date: Date;
    sales_contract_value: number;
    factory_name: string;
    approval_status: number;
    total_count: bigint;
}

export const salesContractAmendmentRouter = createTRPCRouter({
    getSalesContractAmendments: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if(!can_view){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contract amendments." 
                });
            }

            try {
                const result = await ctx.db.$queryRaw<SalesContract[]>`
                    WITH CONTRACTS AS (
                        SELECT 
                            SCM.ID AS ID,
                            SC.SALES_CONTRACT_NO,
                            SC.SALES_CONTRACT_DATE,
                            SCM.amendment_date as amendment_date,
                            COALESCE(SUM(ST.FACTORY_VALUE), 0) AS SALES_CONTRACT_VALUE,
                            F.NAME AS FACTORY_NAME,
                            SC.APPROVAL_STATUS,
                            SCM.amendment_no AS amendment_no,
                            SC.ADDED_AT
                        FROM sales_contract_amendment AS SCM 
                            INNER JOIN SALES_CONTRACTS AS SC ON SCM.sales_contract_id = SC.id
                            INNER JOIN FACTORIES AS F ON F.id = SC.factory_id
                            LEFT JOIN sales_contract_amendment_details AS SCD ON SCD.sales_contract_amendment_id = SCM.id
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
                        GROUP BY SC.id, scm.id, F.NAME, SC.ADDED_AT, SCM.amendment_no, SCM.amendment_date
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CONTRACTS
                    ORDER BY amendment_date DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const salesContractAmendments = result.map(({total_count: _, ...sales_contracts}) => ({
                    ...sales_contracts,
                    sales_contract_value: currencyFormatter(sales_contracts.sales_contract_value, '$'),
                }));

                return { salesContractAmendments, total };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchSalesContractAmendments: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if(!can_view){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contract amendments." 
                });
            };

            try {
                const result = await ctx.db.$queryRaw<SalesContract[]>`
                    WITH CONTRACTS AS (
                        SELECT 
                            SCM.ID AS ID,
                            SC.SALES_CONTRACT_NO,
                            SC.SALES_CONTRACT_DATE,
                            SCM.amendment_date as amendment_date,
                            SUM(ST.FACTORY_VALUE) AS SALES_CONTRACT_VALUE,
                            F.NAME AS FACTORY_NAME,
                            SC.APPROVAL_STATUS,
                            SCM.amendment_no as amendment_no,
                            SC.ADDED_AT
                       FROM sales_contract_amendment AS SCM 
                            INNER JOIN SALES_CONTRACTS AS SC ON SCM.sales_contract_id = SC.id
                            INNER JOIN FACTORIES AS F ON F.id = SC.factory_id
                            LEFT JOIN sales_contract_amendment_details AS SCD ON SCD.sales_contract_amendment_id = SCM.id
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
                                FROM sales_contract_amendment_details SCD2
                                    JOIN order_styles OS ON OS.order_id = SCD2.order_id
                                    JOIN shipment_details SD ON SD.order_style_id = OS.id
                                    JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                                WHERE SCD2.sales_contract_amendment_id = SCM.id
                                AND (
                                    OS.style ILIKE '%' || ${input.query} || '%' OR
                                    SD.buyer_po ILIKE '%' || ${input.query} || '%' OR
                                    BO.REF_NO ILIKE '%' || ${input.query} || '%'
                                )
                            )
                        )
                        GROUP BY SC.id,
                            scm.id, 
                            F.NAME, 
                            SC.ADDED_AT, 
                            SC.SALES_CONTRACT_DATE, 
                            SC.APPROVAL_STATUS, 
                            SC.SALES_CONTRACT_NO, 
                            SCM.amendment_no, 
                            SCM.amendment_date
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM CONTRACTS
                    ORDER BY ADDED_AT DESC, amendment_no DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const salesContracts = result.map(({total_count: _, ...contract}) => {
                    return {
                        ...contract,
                        sales_contract_value: currencyFormatter(Number(contract.sales_contract_value), '$'),
                    }
                });
                
                return { salesContracts, total };
            }
            catch(error) {
                await logError(error, ctx, input);
                handlePrismaError(error);                
            }
        }),

    deleteSalesContractAmendment: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_delete;

            if(!can_delete){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete sales contract amendments." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const currentAmendmentNo = await tx.$queryRaw<{ amendment_no: number }[]>`
                        SELECT SCAM.amendment_no FROM sales_contract_amendment_no_metadata AS SCAM
                            INNER JOIN sales_contracts AS SC ON SC.id = SCAM.sales_contract_id
                            INNER JOIN sales_contract_amendment AS SCA ON SCA.sales_contract_id = SC.id
                        WHERE SCA.ID = ${input.id};
                    `;

                    const getSelectedAmendmentDetails = await tx.sales_contract_amendment.findUnique({
                        where: { id: input.id },
                        select: { 
                            amendment_no: true,
                            sales_contract_id: true,
                        }
                    });

                    if(currentAmendmentNo.length === 0 || getSelectedAmendmentDetails?.amendment_no === currentAmendmentNo?.[0]?.amendment_no) {
                        // Decrement the amendment number in the metadata table
                        await tx.sales_contract_amendment_no_metadata.update({
                            where: { sales_contract_id: getSelectedAmendmentDetails?.sales_contract_id },
                            data: {
                                amendment_no: {
                                    decrement: 1
                                }
                            }
                        });

                        const existingDetails = await tx.sales_contract_amendment_details.findMany({
                            where: {
                                sales_contract_amendment_id: input.id
                            }
                        });

                        await tx.sales_contract_amendment_details.deleteMany({
                            where: {
                                sales_contract_amendment_id: input.id
                            }
                        });

                        for(const detail of existingDetails) {
                            await tx.sales_contract_amendment_details_history.create({
                                data: {
                                    sales_contract_amendment_details: detail.id,
                                    sales_contract_amendment_id: detail.sales_contract_amendment_id,
                                    order_id: detail.order_id,
                                    action_by: ctx.user.id,
                                    action_type: actions.DELETE,
                                }                                    
                            })
                        }

                        const deletedAmend = await tx.sales_contract_amendment.delete({
                            where: { id: input.id }
                        });

                        await tx.sales_contract_amendment_history.create({
                            data: {
                                sales_contract_amendment_id: deletedAmend.id,
                                sales_contract_id: deletedAmend.sales_contract_id,
                                amendment_no: deletedAmend.amendment_no,
                                amendment_date: deletedAmend.amendment_date,
                                action_by: ctx.user.id,
                                action_type: actions.DELETE,
                            }
                        });
                    } else {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Only the most recent amendment can be deleted. Please delete the more recent amendments first."
                        });
                    }
                }, {timeout: 30000})
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getSalesContractsByFactoryId: protectedProcedure
        .input(
            z.object({
                factory_id: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if(!can_view){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts." 
                });
            }

            try {
                const salesContracts = await ctx.db.$queryRaw<{ id: string; sales_contract_no: string }[]>`
                    SELECT 
                        SC.id,
                        SC.sales_contract_no
                    FROM sales_contracts AS SC
                    WHERE (
                        (
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
                        AND SC.factory_id = ${input.factory_id}
                        AND SC.approval_status != 2
                    )
                `;
                return salesContracts;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    createSalesContractAmendment: protectedProcedure
        .input(
            z.object({
                sales_contract_id: z.string(),
                amendment_date: z.date().optional(),
                remarks: z.string().optional(),
                details: z
                    .array(
                        z.object({
                            order_id: z.string(),
                        })
                    )
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_create =
                ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]
                    ?.can_add;

            if (!can_create) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to create sales contract amendments.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const metadata =
                        await tx.sales_contract_amendment_no_metadata.upsert(
                            {
                                where: {
                                    sales_contract_id:
                                        input.sales_contract_id,
                                },
                                update: {
                                    amendment_no: {
                                        increment: 1,
                                    },
                                },
                                create: {
                                    sales_contract_id:
                                        input.sales_contract_id,
                                    amendment_no: 1,
                                },
                            }
                        );

                    const amendmentNo = metadata.amendment_no;

                    const newAmendment = await tx.sales_contract_amendment.create({
                        data: {
                            sales_contract_id: input.sales_contract_id,
                            amendment_no: amendmentNo,
                            amendment_date: input.amendment_date,
                            remarks: input.remarks,
                        },
                    });

                    await tx.sales_contract_amendment_history.create({
                        data: {
                            sales_contract_amendment_id: newAmendment.id,
                            sales_contract_id: newAmendment.sales_contract_id,
                            amendment_no: newAmendment.amendment_no,
                            amendment_date: newAmendment.amendment_date,
                            remarks: newAmendment.remarks,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED,
                        },
                    });

                    const amendmentDetails = await Promise.all(
                        (input.details ?? []).map(async (detail) => {
                            const amendmentDetail = await tx.sales_contract_amendment_details.create({
                                data: {
                                    sales_contract_amendment_id: newAmendment.id,
                                    order_id: detail.order_id,
                                }}
                            );

                            await tx.sales_contract_amendment_details_history.create(
                                {
                                    data: {
                                        sales_contract_amendment_details: amendmentDetail.id,
                                        sales_contract_amendment_id: newAmendment.id,
                                        order_id: detail.order_id,
                                        action_by: ctx.user.id,
                                        action_type: actions.ADDED,
                                    },
                                }
                            );
                            return amendmentDetail;
                        })
                    );

                    const existingDetails = await tx.sales_contract_details.findMany({
                        where: {
                            sales_contract_id:
                                input.sales_contract_id,
                        },
                        select: {
                            id: true,
                            order_id: true,
                        },
                    });

                    const existingOrderIds = new Set(existingDetails.map((detail) => detail.order_id));

                    const inputOrderIds = new Set((input.details ?? []).map((detail) => detail.order_id));

                    const newDetails = (input.details ?? []).filter(
                        (detail) => !existingOrderIds.has(detail.order_id)
                    );

                    const deletedDetails = existingDetails.filter(
                        (detail) => !inputOrderIds.has(detail.order_id)
                    );

                    const createdSalesContractDetails = await Promise.all(
                        newDetails.map(async (detail) => {
                            const newDetail = await tx.sales_contract_details.create({
                                data: {
                                    sales_contract_id:
                                        input.sales_contract_id,
                                    order_id:
                                        detail.order_id,
                                }
                            });

                            await tx.sales_contract_details_history.create({
                                data: {
                                    sales_contract_id: input.sales_contract_id,
                                    sales_contract_details_id: newDetail.id,
                                    order_id: detail.order_id,
                                    action_by: ctx.user.id,
                                    action_type: actions.ADDED,
                                },
                            });

                            return newDetail;
                        })
                    );

                    await Promise.all(
                        deletedDetails.map(async (detail) => {
                            await tx.sales_contract_details_history.create({
                                data: {
                                    sales_contract_id: input.sales_contract_id,
                                    sales_contract_details_id: detail.id,
                                    order_id: detail.order_id,
                                    action_by: ctx.user.id,
                                    action_type: actions.DELETE,
                                },
                            });

                            await tx.sales_contract_details.delete({
                                where: {
                                    id: detail.id,
                                },
                            });
                        })
                    );

                    return {
                        amendment: newAmendment,
                        amendment_details: amendmentDetails,
                        created_details: createdSalesContractDetails,
                        deleted_details: deletedDetails,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getExistingOrderIdForSalesContract: protectedProcedure
        .input(
            z.object({
                salesContractId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ id: number; ref_no: string; buyer_name: string; season_name: string }[]>`
                    SELECT
                        BO.id,
                        BO.ref_no,
                        B.buyer_name,
                        S.season_name
                    FROM buyer_orders AS BO
                        JOIN buyers AS B ON B.id = BO.buyer_id
                        JOIN seasons AS S ON S.id = BO.season_id
                        JOIN sales_contracts AS SC ON SC.id = ${input.salesContractId}
                    WHERE 
                        BO.buyer_id = SC.buyer_id
                        AND BO.factory_id = SC.factory_id
                        AND EXISTS (
                            SELECT 1
                            FROM sales_contract_details SCD
                            WHERE SCD.order_id = BO.id
                            AND SCD.sales_contract_id = SC.id
                        )
                    ORDER BY BO.id DESC;
                `;

                return orders;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),   

    getNewOrderIdForSalesContract: protectedProcedure
        .input(
            z.object({
                salesContractId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contracts."
                });
            }

            try {
                const orders = await ctx.db.$queryRaw<{ id: number; ref_no: string; buyer_name: string; season_name: string }[]>`
                    SELECT
                        BO.id,
                        BO.ref_no,
                        B.buyer_name,
                        S.season_name
                    FROM buyer_orders AS BO
                        JOIN buyers AS B ON B.id = BO.buyer_id
                        JOIN seasons AS S ON S.id = BO.season_id
                        JOIN sales_contracts AS SC ON SC.id = ${input.salesContractId}
                    WHERE 
                        BO.buyer_id = SC.buyer_id
                        AND BO.factory_id = SC.factory_id
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
                                AND SCD.sales_contract_id = SC.id
                            )
                        )
                    ORDER BY BO.id DESC;
                `;

                return orders;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),   

    deleteSalesContractAmendmentDetail: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete sales contract amendment details."
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.$executeRaw`
                        DELETE FROM sales_contract_details AS scd
                        USING sales_contract_amendment_details AS scad,
                            sales_contract_amendment AS sca
                        WHERE scd.order_id = scad.order_id
                            AND scad.sales_contract_amendment_id = sca.id
                            AND scd.sales_contract_id = sca.sales_contract_id
                            AND scad.id = ${input.id};
                    `;

                    const deletedDetail = await tx.sales_contract_amendment_details.delete({
                        where: { id: input.id },
                    });

                    await tx.sales_contract_amendment_details_history.create({
                        data: {
                            sales_contract_amendment_details: deletedDetail.id,
                            sales_contract_amendment_id: deletedDetail.sales_contract_amendment_id,
                            order_id: deletedDetail.order_id,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                        }
                    });
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getSalesContractAmendmentById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if(!can_view){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contract amendments." 
                });
            }

            try {
                const isATeamMember = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        teams: {
                            buyers: {
                                sales_contracts: {
                                    some: {
                                        sales_contract_amendment: {
                                            some: {
                                                id: input.id
                                            }
                                        }
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

                const isLastAmendment = await ctx.db.$queryRaw<{ is_last_amendment: boolean }[]>`
                    SELECT (SCAM.amendment_no = SCA.amendment_no) AS is_last_amendment
                    FROM sales_contract_amendment_no_metadata AS SCAM
                        INNER JOIN sales_contracts AS SC ON SC.id = SCAM.sales_contract_id
                        INNER JOIN sales_contract_amendment AS SCA ON SCA.sales_contract_id = SC.id
                    WHERE SCA.ID = ${input.id};
                `;

                const salesContractAmendmentObj = await ctx.db.sales_contract_amendment.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        amendment_no: true,
                        amendment_date: true,
                        remarks: true,
                        sales_contracts: {
                            select: {
                                id: true,
                                sales_contract_no: true,
                                factories: {
                                    select: {
                                        id: true,
                                    }
                                }
                            }
                        },
                        sales_contract_amendment_details: {
                            select: {
                                id: true,
                                order_id: true,
                            }
                        }
                    }
                });

                const salesContractAmendment = {
                    db_id: salesContractAmendmentObj?.id,
                    factory_id: salesContractAmendmentObj?.sales_contracts.factories.id,
                    sales_contract_id: salesContractAmendmentObj?.sales_contracts.id,
                    sales_contract_no: salesContractAmendmentObj?.sales_contracts.sales_contract_no,
                    amendment_no: salesContractAmendmentObj?.amendment_no,
                    amendment_date: salesContractAmendmentObj?.amendment_date,
                    remarks: salesContractAmendmentObj?.remarks,
                    details: salesContractAmendmentObj?.sales_contract_amendment_details.map(detail => ({
                        id: detail.id,
                        order_id: detail.order_id,
                    })) ?? [],
                };

                return {salesContractAmendment, isLastAmendment: isLastAmendment?.[0]?.is_last_amendment ?? false };
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateSalesContractAmendment: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amendment_date: z.date().optional(),
                remarks: z.string().optional(),
                details: z.array(
                    z.object({
                        id: z.string().optional(),
                        order_id: z.string(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_update;

            if (!can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to update sales contract amendments.",
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    // EXISTING AMENDMENT
                    const existingAmendment = await tx.sales_contract_amendment.findUnique({
                        where: {
                            id: input.id,
                        },
                        select: {
                            id: true,
                            sales_contract_id: true,
                            amendment_no: true,
                        },
                    });

                    if (!existingAmendment) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message:
                                "Sales contract amendment not found.",
                        });
                    }

                    const metadata = await tx.sales_contract_amendment_no_metadata.findUnique({
                        where: {
                            sales_contract_id: existingAmendment.sales_contract_id,
                        },
                        select: {
                            amendment_no: true,
                        },
                    });

                    if ( metadata?.amendment_no !== existingAmendment.amendment_no ) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Only the most recent amendment can be updated.",
                        });
                    }

                    // UPDATE AMENDMENT
                    const updatedAmendment = await tx.sales_contract_amendment.update({
                        where: {
                            id: input.id,
                        },
                        data: {
                            amendment_date: input.amendment_date,
                            remarks: input.remarks,
                        },
                    });

                    await tx.sales_contract_amendment_history.create({
                        data: {
                            sales_contract_amendment_id: updatedAmendment.id,
                            sales_contract_id: existingAmendment.sales_contract_id,
                            amendment_no: existingAmendment.amendment_no,
                            amendment_date: updatedAmendment.amendment_date,
                            remarks: updatedAmendment.remarks,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        },
                    });

                    // EXISTING DETAILS
                    const existingDetails = await tx.sales_contract_amendment_details.findMany({
                        where: {
                            sales_contract_amendment_id: input.id,
                        },
                        select: {
                            id: true,
                            order_id: true,
                        },
                    });

                    const existingOrderIds = new Set(
                        existingDetails.map((d) => d.order_id)
                    );

                    const inputOrderIds = new Set(
                        input.details.map((d) => d.order_id)
                    );

                    const newOrderIds = input.details.filter(
                        (d) => !existingOrderIds.has(d.order_id)
                    ).map((d) => d.order_id);

                    const deletedDetails = existingDetails.filter((d) =>!inputOrderIds.has(d.order_id));

                    const deletedOrderIds = deletedDetails.map((d) => d.order_id);

                    // CREATE AMENDMENT DETAILS
                    if (newOrderIds.length > 0) {
                        await tx.sales_contract_amendment_details.createMany({
                            data: newOrderIds.map((order_id) => ({
                                sales_contract_amendment_id: input.id,
                                order_id,
                            })),
                        });
                    }

                    // fetch newly created rows
                    const createdAmendmentDetails =  newOrderIds.length > 0
                        ? await tx.sales_contract_amendment_details.findMany({
                            where: {
                                sales_contract_amendment_id: input.id,
                                order_id: { in: newOrderIds },
                            },
                            select: {
                                id: true,
                                order_id: true,
                            },
                        })
                        : [];

                    // AMENDMENT DETAIL HISTORY
                    if (createdAmendmentDetails.length > 0) {
                        await tx.sales_contract_amendment_details_history.createMany({
                            data: createdAmendmentDetails.map((detail) => ({
                                sales_contract_amendment_id: input.id,
                                sales_contract_amendment_details: detail.id,
                                order_id: detail.order_id,
                                action_by: ctx.user.id,
                                action_type: actions.ADDED,
                            })),
                        });
                    }

                    if (deletedDetails.length > 0) {
                        await tx.sales_contract_amendment_details_history.createMany({
                            data: deletedDetails.map((detail) => ({
                                sales_contract_amendment_id: input.id,
                                sales_contract_amendment_details: detail.id,
                                order_id: detail.order_id,
                                action_by: ctx.user.id,
                                action_type: actions.DELETE,
                            })),
                        });

                        await tx.sales_contract_amendment_details.deleteMany({
                            where: {
                                id: {
                                    in: deletedDetails.map((d) => d.id),
                                },
                            },
                        });
                    }

                    // SALES CONTRACT DETAILS
                    const existingScDetails = await tx.sales_contract_details.findMany({
                        where: {
                            sales_contract_id: existingAmendment.sales_contract_id,
                            order_id: {
                                in: [...newOrderIds, ...deletedOrderIds],
                            },
                        },
                        select: {
                            id: true,
                            order_id: true,
                        },
                    });

                    const existingScDetailMap = new Map(existingScDetails.map((d) => [d.order_id, d]));

                    // CREATE SC DETAILS
                    const missingScOrderIds = newOrderIds.filter((id) => !existingScDetailMap.has(id));

                    if (missingScOrderIds.length > 0) {
                        await tx.sales_contract_details.createMany({
                            data: missingScOrderIds.map((order_id) => ({
                                sales_contract_id: existingAmendment.sales_contract_id,
                                order_id,
                            })),
                        });

                        const createdScDetails =
                            await tx.sales_contract_details.findMany({
                                where: {
                                    sales_contract_id: existingAmendment.sales_contract_id,
                                    order_id: { in: missingScOrderIds, },
                                },
                                select: {
                                    id: true,
                                    order_id: true,
                                },
                            });

                        await tx.sales_contract_details_history.createMany({
                            data: createdScDetails.map(
                                (detail) => ({
                                    sales_contract_id: existingAmendment.sales_contract_id,
                                    sales_contract_details_id: detail.id,
                                    order_id: detail.order_id,
                                    action_by: ctx.user.id,
                                    action_type: actions.ADDED,
                                })
                            ),
                        });
                    }

                    // DELETE SC DETAILS
                    const scDetailsToDelete = existingScDetails.filter(
                        (d) => deletedOrderIds.includes(d.order_id)
                    );

                    if (scDetailsToDelete.length > 0) {
                        await tx.sales_contract_details_history.createMany({
                            data: scDetailsToDelete.map(
                                (detail) => ({
                                    sales_contract_id: existingAmendment.sales_contract_id,
                                    sales_contract_details_id: detail.id,
                                    order_id: detail.order_id,
                                    action_by: ctx.user.id,
                                    action_type: actions.DELETE,
                                })
                            ),
                        });

                        await tx.sales_contract_details.deleteMany({
                            where: {
                                id: {
                                    in: scDetailsToDelete.map((d) => d.id),
                                },
                            },
                        });
                    }

                    return {
                        amendment: updatedAmendment,
                        created_order_ids: newOrderIds,
                        deleted_order_ids: deletedOrderIds,
                    };
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
    

    isSalesContractAmendmentAuthorized: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if(!can_view){
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contract amendments." 
                });
            }

            try {
                const isAuthorized = await ctx.db.sales_contract_amendment.findFirst({
                    where: {
                        id: input.id,
                        sales_contracts: {
                            approval_status: 2, // Approved sales contracts only
                        }
                    }
                });

                return !!(isAuthorized && isAuthorized.id);
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
            const can_view = ctx.permissions[m.SALES_CONTRACT_AMENDMENTS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view sales contract amendments." 
                });
            }

            const isATeamMember = await ctx.db.team_members.findFirst({
                where: {
                    user_id: ctx.user.id,
                    teams: {
                        buyers: {
                            sales_contracts: {
                                some: {
                                    sales_contract_amendment: {
                                        some: {
                                            id: input.id
                                        }
                                    }
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
                    message: "You do not have permission to view this sales contract amendment." 
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
                    FROM sales_contract_amendment AS SCM 
                        INNER JOIN sales_contracts AS SC ON SCM.sales_contract_id = SC.id
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
                    WHERE SCM.ID = ${input.id}
                `;

                const amendmentData = await ctx.db.$queryRaw<{amendment_date: Date, amendment_no: number}[]>`
                    SELECT amendment_date, amendment_no from sales_contract_amendment WHERE id = ${input.id}
                `;

                const consigneeData = await ctx.db.$queryRaw<{consignee_name: string, consignee_address: string}[]>`
                    SELECT
                        BC.consignee_name AS CONSIGNEE_NAME,
                        BC.ADDRESS AS CONSIGNEE_ADDRESS
                    FROM SALES_CONTRACT_CONSIGNEES AS SCC
                        INNER JOIN BUYER_CONSIGNEE AS BC ON BC.ID = SCC.consignee_id
                        INNER JOIN sales_contract_amendment AS SCA ON SCA.sales_contract_id = SCC.sales_contract_id
                    WHERE SCA.id = ${input.id}
                    ORDER BY BC.sl_no;
                `;

                const latePolicies = await ctx.db.$queryRaw<{late_policy: string}[]>`
                    SELECT 
                        BLP.DESCRIPTION AS LATE_POLICY
                    FROM sales_contracts AS SC
                        INNER JOIN sales_contract_amendment AS SCA ON SCA.sales_contract_id = SC.id
                        INNER JOIN BUYERS AS B ON B.id = SC.buyer_id
                        INNER JOIN buyer_late_policies AS BLP ON BLP.buyer_id = B.id
                    WHERE SCA.ID = ${input.id}
                    ORDER BY BLP.sl_no;
                `;

                const additionalClauses = await ctx.db.$queryRaw<{additional_clause: string}[]>`
                    SELECT 
                        BAC.description AS ADDITIONAL_CLAUSE
                    FROM sales_contracts AS SC
                        INNER JOIN sales_contract_amendment AS SCA ON SCA.sales_contract_id = SC.id
                        INNER JOIN BUYERS AS B ON B.id = SC.buyer_id
                        INNER JOIN BUYER_ADDITIONAL_CLAUSE AS BAC ON BAC.buyer_id = B.id
                    WHERE SCA.ID = ${input.id}
                    ORDER BY BAC.sl_no;
                `;

                const orderDataObj = await ctx.db.sales_contract_amendment.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        sales_contract_amendment_details: {
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

                const currencySymbol = orderDataObj?.sales_contract_amendment_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.symbol ?? '$';
                const currencyName = orderDataObj?.sales_contract_amendment_details?.[0]?.buyer_orders?.order_styles?.[0]?.shipment_details?.[0]?.factory_shipment_details?.[0]?.factory_orders?.currencies?.name ?? 'USD';

                const orderData = orderDataObj?.sales_contract_amendment_details.map(detail => ({
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
                    orderDataObj?.sales_contract_amendment_details.reduce((sumDetail, detail) =>
                        sumDetail + detail.buyer_orders?.order_styles.reduce((sumOs, os) => 
                            sumOs + os.shipment_details.reduce((sumSd, sd) =>
                                sumSd + sd.shipment_item_details.reduce((sumItem, item) => sumItem + item.quantity, 0),
                            0), 
                        0), 
                    0) ?? 0
                );

                const totalValue = orderDataObj?.sales_contract_amendment_details.reduce(
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
    });