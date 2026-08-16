import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { safeNumber } from "~/utils/numbers";
import { generateOrderSummaryExcel } from "../../../_utils/excel/order_summary_report_excel/generateOrderSummaryExcel";
import type { OrderSummaryReportRow } from "./_types/orderSummaryReport";


const normalizeOrderSummaryRow = (row: OrderSummaryReportRow): OrderSummaryReportRow => ({
    ...row,
    LOT_QUANTITY: safeNumber(row.LOT_QUANTITY),
    DELIVERY_QUANTITY: safeNumber(row.DELIVERY_QUANTITY),
    FOB_RATE: safeNumber(row.FOB_RATE),
    FACTORY_RATE: safeNumber(row.FACTORY_RATE),
    ORDER_RDL_VALUE: safeNumber(row.ORDER_RDL_VALUE),
    DELIVERED_RDL_VALUE: safeNumber(row.DELIVERED_RDL_VALUE),
    FACTORY_ORDER_VALUE: safeNumber(row.FACTORY_ORDER_VALUE),
    FACTORY_DELIVERY_VALUE: safeNumber(row.FACTORY_DELIVERY_VALUE),
});

export const orderSummaryReportRouter = createTRPCRouter({
    getOrderSummaryReport: protectedProcedure
        .input(z.object({
            base: z.enum(["ACTUAL EXFACTORY", "EXFACTORY", "ETD", "HANDOVER"]),
            fromDate: z.string(),
            toDate: z.string(),
            buyerIds: z.array(z.number()).optional(),
            factoryIds: z.array(z.number()).optional(),
            brandIds: z.array(z.number()).optional(),
            departmentIds: z.array(z.number()).optional(),
            seasonIds: z.array(z.number()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.ORDER_SUMMARY_REPORT]?.can_view;

            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view order summary report.",
                });
            }

            try {
                const buyerIds = input.buyerIds ?? [];
                const factoryIds = input.factoryIds ?? [];
                const brandIds = input.brandIds ?? [];
                const departmentIds = input.departmentIds ?? [];
                const seasonIds = input.seasonIds ?? [];

                const isFactoryAll = factoryIds.includes(-1);
                const isBrandAll = brandIds.includes(-1);
                const isDepartmentAll = departmentIds.includes(-1);
                const isSeasonAll = seasonIds.includes(-1);

                const isFactorySelected = factoryIds.length > 0 && !isFactoryAll;
                const isBrandSelected =  brandIds.length > 0 && !isBrandAll;
                const isDepartmentSelected = departmentIds.length > 0 && !isDepartmentAll;
                const isSeasonSelected = seasonIds.length > 0 && !isSeasonAll;

                const filters: Prisma.Sql[] = [];
                let dateFilter: Prisma.Sql = Prisma.empty;

                if (buyerIds.length > 0) {
                    filters.push(Prisma.sql`B.id IN (${Prisma.join(buyerIds)})`);
                }

                if (isFactorySelected) {
                    filters.push(Prisma.sql`BO.factory_id IN (${Prisma.join(factoryIds)})`);
                }

                if (isBrandSelected) {
                    filters.push(Prisma.sql`BO.brand_id IN (${Prisma.join(brandIds)})`);
                }

                if (isDepartmentSelected) {
                    filters.push(Prisma.sql`BO.department_id IN (${Prisma.join(departmentIds)})`);
                }

                if (isSeasonSelected) {
                    filters.push(Prisma.sql`BO.season_id IN (${Prisma.join(seasonIds)})`);
                }

                const filterClause = filters.length > 0 ? Prisma.join(filters, " AND ") : Prisma.sql`1=1`;

                switch (input.base) {
                    case 'ACTUAL EXFACTORY':
                        dateFilter = Prisma.sql`E.exfactory_date BETWEEN ${input.fromDate} AND ${input.toDate}`;
                        break;

                    case "EXFACTORY":
                        dateFilter = Prisma.sql`FSD.exfactory_date BETWEEN ${input.fromDate} AND ${input.toDate}`;
                        break;

                    case "HANDOVER":
                        dateFilter = Prisma.sql`SD.handover_date BETWEEN ${input.fromDate} AND ${input.toDate}`;
                        break;
                        
                    case "ETD":
                        dateFilter = Prisma.sql`SD.etd_date BETWEEN ${input.fromDate} AND ${input.toDate}`;
                        break;
                }

                const joinType = input.base === "ACTUAL EXFACTORY" ? "INNER" : "LEFT";
                const joinTypeRaw = Prisma.raw(joinType);

                const results = await ctx.db.$queryRaw<OrderSummaryReportRow[]>`
                    WITH IID AS (
                        SELECT
                            IID.shipment_detail_id AS SD_ID,
                            SUM(IID.QUANTITY) AS IID_QUANTITY,
                            STRING_AGG(CONCAT(C.NAME, '(', IID.quantity, ')'), ', ') AS COLORS
                        FROM shipment_item_details AS IID 
                        INNER JOIN colors AS C ON C.id = IID.color_id
                        GROUP BY IID.shipment_detail_id
                    ),
                    EXFAC_SHIPMENT AS (
                        SELECT 
                            ES.shipment_details_id AS ESSDI,
                            SUM(ES.delivery_quantity) AS delivery_quantity,
                            BOOL_AND(ES.PO_CLOSE) AS PO_CLOSE
                        FROM exfactory_shipments AS ES 
                        GROUP BY ES.shipment_details_id
                    )
                    SELECT
                        BO.ref_no AS "ORDER_NO",
                        F.NAME AS "FACTORY_NAME",
                        B.BUYER_NAME AS "BUYER_NAME",
                        BB.BRAND AS "BRAND",
                        BD.DEPARTMENT AS "DEPARTMENT",
                        BDS.SIZE AS "SIZE",
                        S.SEASON_NAME AS "SEASON_NAME",
                        OS.STYLE AS "STYLE",
                        PT.NAME AS "PRODUCT_TYPE",
                        P.NAME AS "PRODUCT",
                        IID.COLORS AS "COLORS",
                        CONCAT(FB.description, ' ', FB.composition, ' ', FB.VALUE, ' ', FB.unit) AS "FABRIC",
                        FS.NAME AS "FABRIC_SUPPLIER",
                        SD.BUYER_PO AS "BUYER_PO",
                        TO_CHAR(BO.ORDER_DATE, 'DD Mon YYYY') AS "ORDER_DATE",
                        TO_CHAR(FSD.EXFACTORY_DATE, 'DD Mon YYYY') AS "EXFACTORY_DATE",
                        STRING_AGG(DISTINCT TO_CHAR(E.EXFACTORY_DATE, 'DD Mon YYYY'), ', ') AS "ACTUAL_EXFACTORY_DATE", 
                        TO_CHAR(SD.HANDOVER_DATE, 'DD Mon YYYY') AS "HANDOVER_DATE",
                        TO_CHAR(SD.ETD_DATE, 'DD Mon YYYY') AS "ETD_DATE" ,
                        IID.IID_QUANTITY AS "LOT_QUANTITY",
                        ES.delivery_quantity AS "DELIVERY_QUANTITY",
                        SD.FOB_RATE / COALESCE(BO.currency_rate, 1) AS "FOB_RATE",
                        FSD.FACTORY_RATE / COALESCE(FO.currency_rate, 1) AS "FACTORY_RATE",
                        ES.PO_CLOSE AS "PO_CLOSE",
                        IID.IID_QUANTITY * SD.FOB_RATE / COALESCE(BO.currency_rate, 1) AS "ORDER_RDL_VALUE",
                        ES.delivery_quantity * SD.FOB_RATE / COALESCE(BO.currency_rate, 1) AS "DELIVERED_RDL_VALUE",
                        IID.IID_QUANTITY * FSD.FACTORY_RATE / COALESCE(FO.currency_rate, 1) AS "FACTORY_ORDER_VALUE",
                        ES.delivery_quantity * FSD.FACTORY_RATE / COALESCE(FO.currency_rate, 1) AS "FACTORY_DELIVERY_VALUE",
                        T.TEAM_NAME AS "TEAM_NAME"
                    FROM buyer_orders AS BO
                        INNER JOIN order_styles AS OS ON OS.order_id = BO.id
                        INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                        INNER JOIN IID ON IID.SD_ID = SD.id
                        INNER JOIN factories AS F ON F.id = BO.factory_id
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                        INNER JOIN product_types AS PT ON PT.id = OS.product_type_id
                        INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id
                        INNER JOIN buyer_departments AS BD ON BD.id = BO.department_id
                        INNER JOIN seasons AS S ON S.id = BO.season_id
                        INNER JOIN buyer_department_sizes AS BDS ON BDS.id = SD.size_id
                        INNER JOIN products AS P ON P.id = OS.product_id
                        INNER JOIN fabrics AS FB ON FB.id = OS.fabric_id
                        INNER JOIN fabric_suppliers AS FS ON FS.id = OS.supplier_id
                        INNER JOIN factory_orders AS FO ON FO.order_id = BO.id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN TEAMS AS T ON T.ID = BO.team_id
                        ${joinTypeRaw} JOIN EXFAC_SHIPMENT AS ES ON ES.ESSDI = SD.id
                        ${joinTypeRaw} JOIN exfactory_orders AS EO ON EO.order_id = BO.id
                        ${joinTypeRaw} JOIN exfactory AS E ON E.id = EO.exfactory_id
                    WHERE ${dateFilter}
                    AND ${filterClause}
                    AND (
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
                    GROUP BY 
                        BO.ID, 
                        OS.ID, 
                        SD.ID, 
                        F.ID, 
                        B.ID, 
                        PT.ID, 
                        BB.ID, 
                        BD.ID, 
                        S.ID, 
                        BDS.ID, 
                        P.ID, 
                        FB.ID, 
                        FS.ID, 
                        FO.id,
                        FSD.ID, 
                        T.ID, 
                        IID.SD_ID, 
                        IID.COLORS, 
                        IID.IID_QUANTITY, 
                        ES.delivery_quantity, 
                        ES.PO_CLOSE;
                `;

                const normalizedResults = results.map(normalizeOrderSummaryRow);

                const generatedBy = `${ctx.user.first_name ?? ""} ${ctx.user.last_name ?? ""}`.trim();

                const buffer = await generateOrderSummaryExcel(normalizedResults, {
                    base: input.base,
                    fromDate: input.fromDate,
                    toDate: input.toDate,
                    generatedBy: generatedBy || ctx.user.first_name || ctx.user.last_name || "Unknown User",
                });

                return Array.from(new Uint8Array(buffer));
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })
})
