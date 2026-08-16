import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

import type { LcTransferListItem, LcTransferDetails, GetSalesContractValueAndQuantity } from "./_types/lcTransfer";

export const lcTransferRouter = createTRPCRouter({
    getLcTransferList: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_TRANSFER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC Transfer."
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<LcTransferListItem[]>`
                    WITH Transfers AS (
                        SELECT 
                            LCT.ID AS ID, 
                            LC.lc_no AS LC_NO,
                            LC.LC_OPEN_DATE AS LC_OPEN_DATE,
                            LCT.LC_TRANSFER_DATE AS LC_TRANSFER_DATE,
                            B.BUYER_NAME AS BUYER_NAME,
                            LCT.ADDED_AT AS ADDED_AT
                        FROM LC_TRANSFER AS LCT 
                            INNER JOIN LC_MASTER AS LC ON LC.ID = LCT.lc_master_id
                            INNER JOIN BUYERS AS B ON LC.buyer_id = B.id
                            INNER JOIN TEAMS AS T ON T.buyer_id = B.id
                        WHERE ( -- Permission check: Admins or team members can view the LC Transfers
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
                        GROUP BY LCT.ID, LC.ID, B.BUYER_NAME
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM Transfers
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset}
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const lcTransfers = result.map(({total_count: _, ...lc}) => lc);

                return { lcTransfers, total };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchLcTransfers: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                limit: z.number().optional(),
                offset: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_TRANSFER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC Transfer."
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<LcTransferListItem[]>`
                    WITH Transfers AS (
                        SELECT 
                            LCT.ID AS ID, 
                            LC.lc_no AS LC_NO,
                            LC.LC_OPEN_DATE AS LC_OPEN_DATE,
                            LCT.LC_TRANSFER_DATE AS LC_TRANSFER_DATE,
                            B.BUYER_NAME AS BUYER_NAME,
                            LCT.ADDED_AT AS ADDED_AT
                        FROM LC_TRANSFER AS LCT 
                            INNER JOIN LC_MASTER AS LC ON LC.ID = LCT.lc_master_id
                            INNER JOIN BUYERS AS B ON LC.buyer_id = B.id
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
                        AND (
                            LC.lc_no ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY LCT.ID, LC.ID, B.BUYER_NAME
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM Transfers
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;
                
                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const lcTransfers = result.map(({total_count: _, ...lc}) => lc);

                return { lcTransfers, total };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteLcTransfer: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.LC_TRANSFER]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete this LC Transfer."
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const lcDetails = await tx.lc_transfer_details.findMany({
                        where: {
                            lc_transfer_id: input.id,
                        },
                    });

                    for (const detail of lcDetails) {
                        await tx.lc_transfer_details_history.create({
                            data: {
                                lc_transfer_details_id: detail.id,
                                lc_transfer_id: detail.lc_transfer_id,
                                factory_id: detail.factory_id,
                                sales_contract_id: detail.sales_contract_id,
                                lc_transfer_quantity: detail.lc_transfer_quantity,
                                lc_transfer_value: detail.lc_transfer_value,
                                lc_transfer_date: detail.lc_transfer_date,
                                action_type: actions.DELETE,
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await tx.lc_transfer_details.deleteMany({
                        where: {
                            lc_transfer_id: input.id,
                        },
                    });

                    const deletedLcTransfer = await tx.lc_transfer.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    await tx.lc_transfer_history.create({
                        data: {
                            lc_transfer_id: deletedLcTransfer.id,
                            lc_transfer_date: deletedLcTransfer.lc_transfer_date,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                        },
                    });
                }, {timeout: 30000});
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addLcTransfer: protectedProcedure
        .input(
            z.object({
                lc_id: z.string(),
                lc_transfer_date: z.date(),
                remarks: z.string().optional(),
                details: z.array(
                    z.object({
                        lc_transfer_date: z.date(),
                        lc_transfer_quantity: z.number(),
                        lc_transfer_value: z.number(),
                        factory_id: z.number(),
                        sales_contract_id: z.string(),
                    })
                ).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.LC_TRANSFER]?.can_add;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add a new LC Transfer."
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newLcTransfer = await tx.lc_transfer.create({
                        data: {
                            lc_master_id: input.lc_id,
                            lc_transfer_date: input.lc_transfer_date,
                            remarks: input.remarks
                        },
                    });

                    await tx.lc_transfer_history.create({
                        data: {
                            lc_transfer_id: newLcTransfer.id,
                            lc_master_id: newLcTransfer.lc_master_id,
                            lc_transfer_date: newLcTransfer.lc_transfer_date,
                            remarks: newLcTransfer.remarks,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED,
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        for(const detail of input.details) {
                            const newLcTransferDetail = await tx.lc_transfer_details.create({
                                data: {
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                },
                            });

                            await tx.lc_transfer_details_history.create({
                                data: {
                                    lc_transfer_details_id: newLcTransferDetail.id,
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    return newLcTransfer;
                }, {timeout: 30000})

            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getLCForLcTransferByUser: protectedProcedure
        .query(async ({ ctx }) => {
            try {
                const lcList = await ctx.db.$queryRaw<{ lc_id: string, lc_no: string }[]>`
                    WITH LC_DETAILS AS ( -- Calculate total ordered quantity for each LC
                        SELECT 
                            LCO.lc_master_id AS LC_ID,
                            SUM(SID.QUANTITY) AS TOTAL_ORDER_QUANTITY
                        FROM LC_ORDERS AS LCO
                        INNER JOIN LC_SHIPMENTS AS LCS ON LCS.lc_order_id = LCO.id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.id = LCS.shipment_details_id
                        INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.shipment_detail_id = SD.id
                        GROUP BY LCO.lc_master_id
                    ),
                    LC_TRANSFER_DETAILS AS ( -- Calculate total transferred quantity for each LC
                        SELECT
                            LCT.lc_master_id AS LC_ID,
                            SUM(LCTD.lc_transfer_quantity) AS TOTAL_TRANSFER_QUANTITY
                        FROM LC_TRANSFER AS LCT
                        LEFT JOIN LC_TRANSFER_DETAILS AS LCTD ON LCTD.lc_transfer_id = LCT.id
                        GROUP BY LCT.lc_master_id
                    )
                    SELECT 
                        LC.ID AS LC_ID, 
                        LC.lc_no AS LC_NO
                    FROM LC_MASTER AS LC 
                        INNER JOIN LC_DETAILS AS LCD ON LCD.LC_ID = LC.ID
                        LEFT JOIN LC_TRANSFER_DETAILS AS LCTD ON LCTD.LC_ID = LC.ID
                        INNER JOIN BUYERS AS B ON LC.buyer_id = B.id
                        INNER JOIN TEAMS AS T ON T.buyer_id = B.id
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
                            WHERE TM.TEAM_ID = T.ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    GROUP BY LC.ID
                    -- Only show LCs where total ordered quantity is greater than total transferred quantity
                    HAVING SUM(LCD.TOTAL_ORDER_QUANTITY)::NUMERIC(18,2) > COALESCE(SUM(LCTD.TOTAL_TRANSFER_QUANTITY), 0)::NUMERIC(18,2)
                    ORDER BY LC.added_at ASC;
                `;

                return lcList;
            }
            catch (error) {
                            handlePrismaError(error);
            }
        }),

    getLCDetailsForTransfer: protectedProcedure
        .input(
            z.object({
                lc_id: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_TRANSFER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC Transfer."
                });
            }
            
            try {
                const lcDetails = await ctx.db.$queryRaw<LcTransferDetails[]>`
                    WITH SHIPMENTS AS ( -- Calculate the latest ex-factory date for each LC
                        SELECT 
                            LCO.lc_master_id AS LC_ID,
                            MAX(FSD.EXFACTORY_DATE) AS LATEST_EXFACTORY_DATE
                        FROM LC_ORDERS AS LCO
                            INNER JOIN LC_SHIPMENTS AS LCS ON LCS.lc_order_id = LCO.id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.id = LCS.shipment_details_id
                            INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.SHIPMENT_DETAIL_ID = SD.ID
                        WHERE FSD.exfactory_date IS NOT NULL
                        GROUP BY LCO.lc_master_id
                    )
                    SELECT 
                        LC.QUANTITY AS LC_QUANTITY,
                        LC.LC_VALUE,
                        LC.LC_OPEN_DATE,
                        LC.LC_RECEIVED_DATE,
                        LC.LC_EXPIRE_DATE,
                        S.LATEST_EXFACTORY_DATE AS LATEST_SHIPMENT_DATE,
                        B.BUYER_NAME,
                        B.ID AS BUYER_ID,
                        C.NAME AS CURRENCY
                    FROM LC_MASTER AS LC 
                        INNER JOIN SHIPMENTS AS S ON S.LC_ID = LC.ID
                        INNER JOIN CURRENCIES AS C ON C.ID = LC.CURRENCY_ID
                        INNER JOIN BUYERS AS B ON B.ID = LC.BUYER_ID
                    WHERE lC.id = ${input.lc_id};
                `;

                return lcDetails[0];
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getSalesContractForLcTransfer: protectedProcedure
        .input(z.object({
            factory_id: z.number(),
            lc_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const salesContracts = await ctx.db.$queryRaw<{id: string, sales_contract_no: string}[]>`
                    WITH TRANSFER AS ( -- Calculate total transferred quantity for each sales contract under the given LC
                        SELECT 
                            LCTD.SALES_CONTRACT_ID,
                            SUM(LCTD.LC_TRANSFER_QUANTITY) AS TRANSFER_QUANTITY
                        FROM LC_TRANSFER_DETAILS AS LCTD
                        GROUP BY LCTD.SALES_CONTRACT_ID
                    ),
                    SHIPMENT AS ( -- Calculate total shipped quantity for each sales contract under the given LC
                        SELECT
                            SCD.SALES_CONTRACT_ID,
                            SUM(SID.QUANTITY) AS SC_QUANTITY
                        FROM SALES_CONTRACT_DETAILS AS SCD
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = SCD.ORDER_ID
                            INNER JOIN ORDER_STYLES AS OS ON OS.ORDER_ID = BO.ID
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ORDER_STYLE_ID = OS.ID
                            INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.SHIPMENT_DETAIL_ID = SD.ID
                        WHERE EXISTS (
                            SELECT 1
                            FROM LC_MASTER AS LC
                                INNER JOIN LC_ORDERS AS LCO ON LCO.LC_MASTER_ID = LC.ID
                            WHERE LCO.ORDER_ID = SCD.ORDER_ID
                            AND LC.ID = ${input.lc_id}
                        )
                        GROUP BY SCD.SALES_CONTRACT_ID
                    )
                    SELECT 
                        SC.ID,
                        SC.SALES_CONTRACT_NO
                    FROM SALES_CONTRACTS AS SC
                        INNER JOIN BUYERS AS B ON SC.BUYER_ID = B.ID
                        INNER JOIN TEAMS AS T ON T.BUYER_ID = B.ID
                        INNER JOIN SHIPMENT AS S ON S.SALES_CONTRACT_ID = SC.ID
                        LEFT JOIN TRANSFER AS TR ON TR.SALES_CONTRACT_ID = SC.ID
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
                            WHERE TM.TEAM_ID = T.ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    AND COALESCE(TR.TRANSFER_QUANTITY, 0)::NUMERIC(18,2) < S.SC_QUANTITY::NUMERIC(18,2)
                    AND SC.FACTORY_ID = ${input.factory_id}
                    GROUP BY SC.ID;
                `;

                return salesContracts;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getSalesContractValueAndQuantity: protectedProcedure
        .input(z.object({
            sales_contract_id: z.string(),
            lcTransferId: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const hasLcTransferId = !!input.lcTransferId;

                const currentTransferQuery = hasLcTransferId 
                    ? Prisma.sql`WHERE LCT.ID <> ${input.lcTransferId} ` 
                    : Prisma.empty;

                const result = await ctx.db.$queryRaw<GetSalesContractValueAndQuantity[]>`
                    WITH SHIPMENTS AS ( -- Calculate total shipped quantity and value for the given sales contract
                        SELECT 
                            BO.ID AS ORDER_ID,
                            SUM(SID.QUANTITY) AS SHIPMENT_QUANTITY,
                            SUM(SID.QUANTITY) * FSD.FACTORY_RATE AS SHIPMENT_VALUE
                        FROM BUYER_ORDERS AS BO
                            INNER JOIN ORDER_STYLES AS OS ON OS.ORDER_ID = BO.ID
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ORDER_STYLE_ID = OS.ID
                            INNER JOIN SHIPMENT_ITEM_DETAILS AS SID ON SID.SHIPMENT_DETAIL_ID = SD.ID
                            INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.SHIPMENT_DETAIL_ID = SD.ID
                        GROUP BY SD.ID, BO.ID, FSD.ID
                    ),
                    TRANSFER AS ( -- Calculate total transferred quantity and value for the given sales contract, excluding the current transfer if lcTransferId is provided
                        SELECT
                            LTD.SALES_CONTRACT_ID AS SALES_CONTRACT_ID,
                            SUM(LC_TRANSFER_QUANTITY) AS PREVIOUS_TRANSFER_QUANTITY,
                            SUM(LC_TRANSFER_VALUE) AS PREVIOUS_TRANSFER_VALUE
                        FROM LC_TRANSFER_DETAILS AS LTD
                            INNER JOIN LC_TRANSFER AS LCT ON LCT.id = LTD.lc_transfer_id
                        ${currentTransferQuery}
                        GROUP BY LTD.SALES_CONTRACT_ID
                    )
                    SELECT 
                        SUM(S.SHIPMENT_QUANTITY) AS SC_QUANTITY,
                        SUM(S.SHIPMENT_VALUE) AS SC_VALUE,
                        T.PREVIOUS_TRANSFER_QUANTITY,
                        T.PREVIOUS_TRANSFER_VALUE
                    FROM sales_contracts AS SC
                        INNER JOIN SALES_CONTRACT_DETAILS AS SCD ON SCD.SALES_CONTRACT_ID = SC.ID
                        INNER JOIN SHIPMENTS AS S ON S.ORDER_ID = SCD.ORDER_ID
                        LEFT JOIN TRANSFER AS T ON T.SALES_CONTRACT_ID = SC.ID
                    WHERE SC.ID = ${input.sales_contract_id}
                    GROUP BY SC.ID, T.PREVIOUS_TRANSFER_QUANTITY, T.PREVIOUS_TRANSFER_VALUE;
                `;

                return result[0];
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteTransfer: protectedProcedure
        .input(z.object({
            lc_transfer_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.LC_TRANSFER]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete this LC Transfer detail."
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const transferDetail = await tx.lc_transfer_details.delete({
                        where: {
                            id: input.lc_transfer_id,
                        },
                    });

                    await tx.lc_transfer_details_history.create({
                        data: {
                            lc_transfer_details_id: transferDetail.id,
                            lc_transfer_id: transferDetail.lc_transfer_id,
                            factory_id: transferDetail.factory_id,
                            sales_contract_id: transferDetail.sales_contract_id,
                            lc_transfer_quantity: transferDetail.lc_transfer_quantity,
                            lc_transfer_value: transferDetail.lc_transfer_value,
                            lc_transfer_date: transferDetail.lc_transfer_date,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return transferDetail;
                }, {timeout: 30000});

            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateLcTransfer: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                lc_id: z.string(),
                lc_transfer_date: z.date(),
                remarks: z.string().optional(),
                details: z.array(
                    z.object({
                        id: z.string().optional(),
                        lc_transfer_date: z.date(),
                        lc_transfer_quantity: z.number(),
                        lc_transfer_value: z.number(),
                        factory_id: z.number(),
                        sales_contract_id: z.string(),
                    })
                ).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.LC_TRANSFER]?.can_update;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update this LC Transfer."
                });
            }
            
            try {
                return await ctx.db.$transaction(async (tx) => {
                    const newLcTransfer = await tx.lc_transfer.update({
                        where: {
                            id: input.id
                        },
                        data: {
                            lc_master_id: input.lc_id,
                            lc_transfer_date: input.lc_transfer_date,
                            remarks: input.remarks
                        },
                    });

                    await tx.lc_transfer_history.create({
                        data: {
                            lc_transfer_id: newLcTransfer.id,
                            lc_master_id: newLcTransfer.lc_master_id,
                            lc_transfer_date: newLcTransfer.lc_transfer_date,
                            remarks: newLcTransfer.remarks,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        },
                    });

                    const detailsToBeAdded = input.details?.filter(detail => !detail.id);
                    const detailsToBeUpdated = input.details?.filter(detail => detail.id);

                    // Update existing details and add new details
                    if (detailsToBeUpdated && detailsToBeUpdated.length > 0) {
                        for(const detail of detailsToBeUpdated) {
                            const newLcTransferDetail = await tx.lc_transfer_details.update({
                                where: {
                                    id: detail.id
                                },
                                data: {
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                },
                            });

                            await tx.lc_transfer_details_history.create({
                                data: {
                                    lc_transfer_details_id: newLcTransferDetail.id,
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(detailsToBeAdded && detailsToBeAdded.length > 0) {
                        for(const detail of detailsToBeAdded) {
                            const newLcTransferDetail = await tx.lc_transfer_details.create({
                                data: {
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                },
                            });

                            await tx.lc_transfer_details_history.create({
                                data: {
                                    lc_transfer_details_id: newLcTransferDetail.id,
                                    lc_transfer_id: newLcTransfer.id,
                                    factory_id: detail.factory_id,
                                    sales_contract_id: detail.sales_contract_id,
                                    lc_transfer_quantity: detail.lc_transfer_quantity,
                                    lc_transfer_value: detail.lc_transfer_value,
                                    lc_transfer_date: detail.lc_transfer_date,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    return newLcTransfer;
                }, {timeout: 30000})
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getLcTransferById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.LC_TRANSFER]?.can_view;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view this LC Transfer."
                });
            }
            
            try {
                const lcTransferObj = await ctx.db.lc_transfer.findUnique({
                    where: {
                        id: input.id,
                    },
                    select: {
                        id: true,
                        lc_master: {
                            select: {
                                id: true,
                                lc_no: true,
                            }
                        },
                        lc_transfer_date: true,
                        remarks: true,
                        lc_transfer_details: {
                            select: {
                                id: true,
                                factory_id: true,
                                sales_contracts: {
                                    select: {
                                        id: true,
                                        sales_contract_no: true,
                                    }
                                },
                                lc_transfer_quantity: true,
                                lc_transfer_value: true,
                                lc_transfer_date: true,
                            },
                        },
                    },
                });

                const lcTransfer = lcTransferObj ? {
                    id: lcTransferObj.id,
                    lc_id: lcTransferObj.lc_master.id,
                    lc_no: lcTransferObj.lc_master.lc_no,
                    lc_transfer_date: lcTransferObj.lc_transfer_date,
                    remarks: lcTransferObj.remarks,
                    details: lcTransferObj.lc_transfer_details.map(detail => ({
                        id: detail.id,
                        factory_id: detail.factory_id,
                        sales_contract_id: detail.sales_contracts.id,
                        sales_contract_no: detail.sales_contracts.sales_contract_no,
                        lc_transfer_quantity: detail.lc_transfer_quantity,
                        lc_transfer_value: detail.lc_transfer_value,
                        lc_transfer_date: detail.lc_transfer_date,
                    })),
                } : null;

                return lcTransfer;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

});