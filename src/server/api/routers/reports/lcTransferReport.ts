import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { safeNumber } from "~/utils/numbers";
import { Prisma } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { formatDate } from "~/utils/localDateString";

interface LCTransferReportHeader {
    buyer_name: string;
    lc_no: string;
    lc_value: number;
    lc_quantity: number;
}

interface LCTransferTableData {
    factory_name: string;
    lc_transfer_value: number;
    lc_transfer_quantity: number;
    lc_transfer_date: Date;
}

export const lcTransferReportRouter = createTRPCRouter({
    getLCByBuyerId: protectedProcedure
        .input(z.object({
            buyer_id: z.number()
        }))
        .query(async ({ctx, input}) => {
            try {
                const lcs = await ctx.db.lc_master.findMany({
                    where: {
                        buyer_id: input.buyer_id
                    },
                    select: {
                        id: true,
                        lc_no: true
                    }
                })

                return lcs;
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPDFData: protectedProcedure
        .input(z.object({
            lc_id: z.string(),
            factory_id: z.number().optional()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_TRANSFER_REPORT]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC Transfer report'
                })
            }

            const isFactorySelected = !!input?.factory_id;

            try {
                const headerData = await ctx.db.$queryRaw<LCTransferReportHeader[]>`
                    SELECT 
                        B.buyer_name,
                        LC.lc_no,
                        SUM(SID.quantity * SD.fob_rate) AS LC_VALUE,
                        SUM(SID.quantity) AS LC_QUANTITY
                    FROM lc_master AS LC
                        INNER JOIN lc_shipments AS LCS ON LCS.lc_master_id = LC.id
                        INNER JOIN shipment_details AS SD ON SD.id = LCS.shipment_details_id
                        INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                        INNER JOIN buyers AS B ON B.id = LC.buyer_id
                        ${isFactorySelected ? Prisma.sql`
                            INNER JOIN lc_orders AS LCO ON LCO.id = LCS.lc_order_id
                            INNER JOIN buyer_orders AS BO ON BO.id = LCO.order_id
                        ` : Prisma.empty}
                    WHERE LC.id = ${input.lc_id}
                        ${isFactorySelected ? Prisma.sql`AND BO.factory_id = ${input.factory_id}` : Prisma.empty}
                    GROUP BY B.ID, LC.ID;
                `;

                const tableDataObj = await ctx.db.$queryRaw<LCTransferTableData[]>`
                    SELECT
                        F.name AS factory_name,
                        LCD.lc_transfer_value,
                        LCD.lc_transfer_quantity,
                        LCD.lc_transfer_date
                    FROM lc_transfer AS LCT
                        INNER JOIN lc_transfer_details AS LCD ON LCD.lc_transfer_id = LCT.id
                        INNER JOIN factories AS F ON F.id = LCD.factory_id 
                    WHERE LCT.lc_master_id = ${input.lc_id}
                        ${isFactorySelected ? Prisma.sql`AND LCD.factory_id = ${input.factory_id}` : Prisma.empty};
                `;

                const tableData = tableDataObj.map(item => ({
                    ...item,
                    lc_transfer_value: currencyFormatter(safeNumber(item.lc_transfer_value), '$'),
                    lc_transfer_quantity: quantityFormatter(safeNumber(item.lc_transfer_quantity)),
                    lc_transfer_date: formatDate(item.lc_transfer_date)
                }));

                const totalQuantity = tableDataObj.reduce((sum, item) => sum = sum + safeNumber(item.lc_transfer_quantity), 0);
                const totalValue = tableDataObj.reduce((sum, item) => sum = sum + safeNumber(item.lc_transfer_value), 0) ?? 0;

                const totals = {
                    totalValue: currencyFormatter(totalValue, '$'),
                    totalQuantity: quantityFormatter(totalQuantity ?? 0)
                }
                
                const header = headerData.map(item => ({
                    ...item,
                    lc_value: currencyFormatter(safeNumber(item.lc_value), '$'),
                    lc_quantity: quantityFormatter(safeNumber(item.lc_quantity)),
                    balance_quantity: currencyFormatter(safeNumber(item.lc_quantity) - totalQuantity, '$'),
                    balance_value: quantityFormatter(safeNumber(item.lc_value) - totalValue)
                }))

                return { header: header[0], tableData, totals }
            }
            catch (error){
                console.error(error)
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
})