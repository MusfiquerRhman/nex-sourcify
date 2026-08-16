import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";

interface ExportReportBaseRow {
    buyer_id: string;
    buyer_name: string;
    factory_id?: string;
    factory_name?: string;
    team_id?: string;
    team_name?: string;
    brand_id?: string;
    brand?: string;
    department_id?: string;
    department?: string;
    product_type_id?: string;
    product_type?: string;
    quantity: number;
    rdl_value: number;
    factory_value: number;
    commission_value?: number;
}

export const exportReportRouter = createTRPCRouter({
    getExportReport: protectedProcedure
        .input(
            z.object({
                fromDate: z.string().optional(),
                toDate: z.string().optional(),
                buyerIds: z.array(z.number()).optional(),
                factoryIds: z.array(z.number()).optional(),
                brandIds: z.array(z.number()).optional(),
                departmentIds: z.array(z.number()).optional(),
                productTypeIds: z.array(z.number()).optional(),
                teamIds: z.array(z.number()).optional(),
                quantity: z.boolean().optional(),
                rdlValue: z.boolean().optional(),
                factoryValue: z.boolean().optional(),
                commissionValue: z.boolean().optional(),
                base: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SALES_REPORT]?.can_view;
            
            if (!can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view sales report.",
                });
            }
            
            try {
                const fromDate = input.fromDate;
                const toDate = input.toDate;

                const buyerIds = input.buyerIds ?? [];
                const factoryIds = input.factoryIds ?? [];
                const brandIds = input.brandIds ?? [];
                const departmentIds = input.departmentIds ?? [];
                const productTypeIds = input.productTypeIds ?? [];
                const teamIds = input.teamIds ?? [];

                const isFactoryNone = factoryIds.includes(-2);
                const isBrandNone = brandIds.includes(-2);
                const isDepartmentNone = departmentIds.includes(-2);
                const isProductTypeNone = productTypeIds.includes(-2);
                const isTeamNone = teamIds.includes(-2);

                const isFactoryAll = factoryIds.includes(-1);
                const isBrandAll = brandIds.includes(-1);
                const isDepartmentAll = departmentIds.includes(-1);
                const isProductTypeAll = productTypeIds.includes(-1);
                const isTeamAll = teamIds.includes(-1);

                const isFactoryDimension = !isFactoryNone && factoryIds.length > 0;
                const isBrandDimension = !isBrandNone && brandIds.length > 0;
                const isDepartmentDimension = !isDepartmentNone && departmentIds.length > 0;
                const isProductTypeDimension = !isProductTypeNone && productTypeIds.length > 0;
                const isTeamDimension = !isTeamNone && teamIds.length > 0;

                const isFactorySelected = isFactoryDimension && !isFactoryAll;
                const isBrandSelected = isBrandDimension && !isBrandAll;
                const isDepartmentSelected = isDepartmentDimension && !isDepartmentAll;
                const isProductTypeSelected = isProductTypeDimension && !isProductTypeAll;
                const isTeamSelected = isTeamDimension && !isTeamAll;

                // -----------------------------------------------------------------------------
                // SELECT
                // -----------------------------------------------------------------------------

                const baseSelectFields: Prisma.Sql[] = [
                    Prisma.sql`B.id AS buyer_id`,
                    Prisma.sql`B.buyer_name`,
                    Prisma.sql`ES.delivery_quantity AS quantity`,
                    Prisma.sql`ES.delivery_quantity * SD.FOB_RATE AS rdl_value`,
                    Prisma.sql`ES.delivery_quantity * FSD.FACTORY_RATE AS factory_value`,
                ];

                if (isFactoryDimension) {
                    baseSelectFields.push(
                        Prisma.sql`F.id AS factory_id`,
                        Prisma.sql`F.name AS factory_name`
                    );
                }

                if (isTeamDimension) {
                    baseSelectFields.push(
                        Prisma.sql`T.id AS team_id`,
                        Prisma.sql`T.team_name`
                    );
                }

                if (isBrandDimension) {
                    baseSelectFields.push(
                        Prisma.sql`BB.id AS brand_id`,
                        Prisma.sql`BB.brand`
                    );
                }

                if (isDepartmentDimension) {
                    baseSelectFields.push(
                        Prisma.sql`BD.id AS department_id`,
                        Prisma.sql`BD.department`
                    );
                }

                if(isProductTypeDimension) {
                    baseSelectFields.push(
                        Prisma.sql`PT.id AS product_type_id`,
                        Prisma.sql`PT.name AS product_type`
                    );
                }

                if(input.commissionValue) {
                    baseSelectFields.push(Prisma.sql`
                        (ES.delivery_quantity * SD.FOB_RATE) - (ES.delivery_quantity * FSD.FACTORY_RATE) AS commission_value
                    `);
                }

                // -----------------------------------------------------------------------------
                // JOINS
                // -----------------------------------------------------------------------------

                const joins: Prisma.Sql[] = [
                    Prisma.sql`INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id`,
                    Prisma.sql`INNER JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.id`,
                    Prisma.sql`INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id`,
                    Prisma.sql`INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id`,
                    Prisma.sql`INNER JOIN buyer_orders AS BO ON BO.id = EO.order_id`,
                    Prisma.sql`INNER JOIN factory_orders AS FO ON FO.order_id = BO.id`,
                    Prisma.sql`INNER JOIN buyers AS B ON B.id = BO.buyer_id`,
                    Prisma.sql`INNER JOIN factories AS F ON F.id = BO.factory_id`,
                    Prisma.sql`INNER JOIN teams AS T ON T.id = BO.team_id`,
                ];

                if (isBrandDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id`
                    );
                }

                if (isDepartmentDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN buyer_departments AS BD ON BD.id = BO.department_id`
                    );
                }

                if(input.commissionValue) {
                    joins.push(
                        Prisma.sql`LEFT JOIN commission_distributions_details AS CDD ON SD.id = CDD.shipment_details_id`
                    );
                }

                if(isProductTypeDimension) {
                    joins.push(
                        Prisma.sql`LEFT JOIN order_styles AS OS ON OS.order_id = BO.id`,
                        Prisma.sql`LEFT JOIN product_types AS PT ON PT.id = OS.product_type_id`
                    );
                }

                // -----------------------------------------------------------------------------
                // WHERE
                // -----------------------------------------------------------------------------

                const filters: Prisma.Sql[] = [];

                if (buyerIds.length > 0) {
                    filters.push(
                        Prisma.sql`B.id IN (${Prisma.join(buyerIds)})`
                    );
                }

                if (isFactorySelected) {
                    filters.push(
                        Prisma.sql`BO.factory_id IN (${Prisma.join(factoryIds)})`
                    );
                }

                if (isBrandSelected) {
                    filters.push(
                        Prisma.sql`BO.brand_id IN (${Prisma.join(brandIds)})`
                    );
                }

                if (isDepartmentSelected) {
                    filters.push(
                        Prisma.sql`BO.department_id IN (${Prisma.join(departmentIds)})`
                    );
                }

                if (isProductTypeSelected) {
                    filters.push(
                        Prisma.sql`OS.product_type_id IN (${Prisma.join(productTypeIds)})`
                    );
                }

                if (isTeamSelected) {
                    filters.push(
                        Prisma.sql`BO.team_id IN (${Prisma.join(teamIds)})`
                    );
                }

                const filterClause =
                    filters.length > 0
                        ? Prisma.join(filters, " AND ")
                        : Prisma.sql`1=1`;

                // -----------------------------------------------------------------------------
                // QUERY
                // -----------------------------------------------------------------------------

                const outerSelectFields: Prisma.Sql[] = [Prisma.sql`buyer_id`, Prisma.sql`buyer_name`];
                const outerGroupByFields: Prisma.Sql[] = [Prisma.sql`buyer_id`, Prisma.sql`buyer_name`];

                if (isFactoryDimension) {
                    outerSelectFields.push(Prisma.sql`factory_id`, Prisma.sql`factory_name`);
                    outerGroupByFields.push(Prisma.sql`factory_id`, Prisma.sql`factory_name`);
                }

                if (isTeamDimension) {
                    outerSelectFields.push(Prisma.sql`team_id`, Prisma.sql`team_name`);
                    outerGroupByFields.push(Prisma.sql`team_id`, Prisma.sql`team_name`);
                }

                if (isBrandDimension) {
                    outerSelectFields.push(Prisma.sql`brand_id`, Prisma.sql`brand`);
                    outerGroupByFields.push(Prisma.sql`brand_id`, Prisma.sql`brand`);
                }

                if (isDepartmentDimension) {
                    outerSelectFields.push(Prisma.sql`department_id`, Prisma.sql`department`);
                    outerGroupByFields.push(Prisma.sql`department_id`, Prisma.sql`department`);
                }

                if(isProductTypeDimension) {
                    outerSelectFields.push(Prisma.sql`product_type_id`, Prisma.sql`product_type`);
                    outerGroupByFields.push(Prisma.sql`product_type_id`, Prisma.sql`product_type`);
                }

                const result = await ctx.db.$queryRaw<ExportReportBaseRow[]>`
                    WITH report_base AS (
                        SELECT
                            ${Prisma.join(baseSelectFields, ", ")}
                        FROM exfactory AS E
                            ${Prisma.join(joins, "\n")}
                        WHERE
                            E.exfactory_date BETWEEN ${fromDate} AND ${toDate}
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
                    )
                    SELECT
                        ${Prisma.join(outerSelectFields, ", ")},
                        SUM(quantity) AS quantity,
                        SUM(rdl_value) AS rdl_value,
                            SUM(factory_value) AS factory_value
                            ${input.commissionValue ? Prisma.sql`, SUM(commission_value) AS commission_value` : Prisma.sql``}
                    FROM report_base
                    GROUP BY
                            ${Prisma.join(outerGroupByFields, ", ")}
                    ORDER BY buyer_name ASC;
                `;

                const exportReportData = result.map((row) => ({
                    buyer_name: row.buyer_name,
                    ...(isFactoryDimension ? { factory_name: row.factory_name ?? "" } : {}),
                    ...(isTeamDimension ? { team_name: row.team_name ?? "" } : {}),
                    ...(isBrandDimension ? { brand: row.brand ?? "" } : {}),
                    ...(isDepartmentDimension ? { department: row.department ?? "" } : {}),
                    ...(input.productTypeIds ? { product_type: row.product_type ?? "" } : {}),
                    ...(input.quantity ? { quantity: quantityFormatter(Number(row.quantity) ?? 0) } : {}),
                    ...(input.rdlValue ? { rdl_value: currencyFormatter(Number(row.rdl_value) ?? 0, '$') } : {}),
                    ...(input.factoryValue ? { factory_value: currencyFormatter(Number(row.factory_value) ?? 0, '$') } : {}),
                    ...(input.commissionValue ? { commission_value: currencyFormatter(Number(row.commission_value) ?? 0, '$') } : {}),
                }));

                const totalQuantity = result.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
                const totalRdlValue = result.reduce((sum, row) => sum + Number(row.rdl_value ?? 0), 0);
                const totalFactoryValue = result.reduce((sum, row) => sum + Number(row.factory_value ?? 0), 0);
                const totalCommissionValue = result.reduce((sum, row) => sum + Number(row.commission_value ?? 0), 0);
                
                const results = {
                    ...(input.quantity ? { quantity: input.quantity ? quantityFormatter(totalQuantity) : undefined } : {}),
                    ...(input.rdlValue ? { rdl_value: input.rdlValue ? currencyFormatter(totalRdlValue, '$') : undefined } : {}),
                    ...(input.factoryValue ? { factory_value: input.factoryValue ? currencyFormatter(totalFactoryValue, '$') : undefined } : {}),
                    ...(input.commissionValue ? { commission_value: input.commissionValue ? currencyFormatter(totalCommissionValue, '$') : undefined } : {}),
                };

                return {exportReportData, totals: results};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })

})