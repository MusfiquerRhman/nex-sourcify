import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { generateCommissionDistributionReportExcel } from "../../../_utils/excel/commission_distribution_report_excel/generateCommissionDistributionReport";
import { safeNumber } from "~/utils/numbers";

interface CommissionReport {
    buyer_name: string;
    rdl_value: number;
    factory_value: number;
    other_commission: number;
    overseas_commission: number;
    dhaka_commission: number;
}

const normalizeData = (row: CommissionReport): CommissionReport => ({
    ...row,
    rdl_value: safeNumber(row.rdl_value),
    factory_value: safeNumber(row.factory_value),
    other_commission: safeNumber(row.other_commission),
    overseas_commission: safeNumber(row.overseas_commission),
    dhaka_commission: safeNumber(row.dhaka_commission),
});

export const commissionDistributionReportRouter = createTRPCRouter({
    getCommissionDistributionReport: protectedProcedure
        .input(z.object({
            fromDate: z.string().min(1),
            toDate: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.COMMISSION_REPORT]?.can_view) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view commission distribution reports.",
                });
            }

            try {
                const rows = await ctx.db.$queryRaw<CommissionReport[]>`
                    SELECT
                        B.buyer_name,
                        SUM(SD.FOB_RATE * ES.DELIVERY_QUANTITY)::NUMERIC(18, 2) AS rdl_value,
                        SUM(FSD.factory_rate * ES.DELIVERY_QUANTITY)::NUMERIC(18, 2) AS factory_value,
                        COALESCE(SUM(SD.FOB_RATE * ES.DELIVERY_QUANTITY * CDD.OTHERS_COMMISSION_PERCENTAGE / 100)::NUMERIC(18, 2), 0) AS other_commission,
                        COALESCE(SUM(SD.FOB_RATE * ES.DELIVERY_QUANTITY * CDD.OVERSEAS_COMMISSION_PERCENTAGE / 100)::NUMERIC(18, 2), 0) AS overseas_commission,
                        COALESCE(SUM(SD.FOB_RATE * ES.DELIVERY_QUANTITY * CDD.DHAKA_COMMISSION_PERCENTAGE / 100)::NUMERIC(18, 2), 0) AS dhaka_commission
                    FROM exfactory AS E
                        INNER JOIN exfactory_orders AS EO ON EO.exfactory_id = E.id
                        INNER JOIN exfactory_shipments AS ES ON ES.exfactory_orders_id = EO.id
                        INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN commission_distributions_details AS CDD ON CDD.shipment_details_id = SD.id
                        INNER JOIN buyer_orders AS BO ON BO.id = EO.order_id
                        INNER JOIN buyers AS B ON B.id = BO.buyer_id
                    WHERE E.exfactory_date >= ${input.fromDate}::date
                        AND E.exfactory_date < (${input.toDate}::date + INTERVAL '1 day')
                    GROUP BY B.id, B.buyer_name
                    ORDER BY B.buyer_name;
                `;

                const normalizedData = rows.map(normalizeData);

                const buffer = await generateCommissionDistributionReportExcel({
                    rows: normalizedData,
                    fromDate: input.fromDate,
                    toDate: input.toDate,
                    generatedBy: `${ctx.user.first_name ?? ""} ${ctx.user.last_name ?? ""}`.trim(),
                });

                return Array.from(new Uint8Array(buffer));
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});