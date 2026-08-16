import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import type { Charges, ClaimAdjustment, DebitNotes, LcScClosingHeader, LcScTableData } from "./_types/lcScClosing";
import { dividedByZeroSafe, safeNumber } from "~/utils/numbers";

export const lcScClosingRouter = createTRPCRouter({
    getLCs: protectedProcedure
        .input(z.object({
            base: z.enum(['LC', 'SC']),
            buyerId: z.number().optional()
        }))
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC/SC Closing Report'
                })
            }

            try {
                let scLcList: { id: string, sc_lc_no: string}[];

                if(input.base === 'LC'){
                    scLcList = await ctx.db.lc_master.findMany({
                        where: {
                            buyer_id:  input.buyerId
                        },
                        select: {
                            id: true,
                            lc_no: true
                        }
                    }).then(results => results.map(item => ({ id: item.id, sc_lc_no: item.lc_no })))
                }
                else {
                    scLcList = await ctx.db.sales_contracts.findMany({
                        where: {
                            buyer_id: input.buyerId
                        },
                        select: {
                            id: true,
                            sales_contract_no: true
                        }
                    }).then(results => results.map(item => ({ id: item.id, sc_lc_no: item.sales_contract_no})))
                }

                return scLcList;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
    
    getPDFData: protectedProcedure
        .input(z.object({
            lcScId: z.string(),
            from_date: z.date().optional(),
            to_date: z.date().optional()
        }))
        .query( async ({ctx, input}) => {
            const can_view = ctx.permissions[m.LC_SC_CLOSING]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view LC/SC Closing Report'
                })
            }

            try {
                const isPartial = !!input.from_date && !!input.to_date;

                let headerData: LcScClosingHeader[];
                let tableData: LcScTableData[];
                let charges: Charges[];
                let claimAdjustment: ClaimAdjustment[];
                let debitNotes: DebitNotes[];

                // Parallel Query Processing
                await Promise.all([
                    headerData = await ctx.db.$queryRaw<LcScClosingHeader[]>`
                        SELECT	
                            LC.lc_no,
                            B.buyer_name,
                            SUM(SID.quantity) AS order_quantity,
                            SUM(SID.quantity * SD.fob_rate / BO.currency_rate) AS value,
                            SUM(SID.quantity * SD.fob_rate) AS secondary_value,
                            C.symbol
                        FROM lc_master AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                            INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                            INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
                            INNER JOIN buyers AS B ON B.id = LC.buyer_id
                        WHERE LC.ID = ${input.lcScId}
                        GROUP BY LC.ID, B.ID;
                    `,

                    tableData = await ctx.db.$queryRaw<LcScTableData[]>`
                        WITH EXFACTORY AS (
                            SELECT
                                LO.lc_master_id AS E_LC_ID,
                                MIN(E.exfactory_date) AS MIN_EXFACTORY_DATE,
                                MAX(E.exfactory_date) AS MAX_EXFACTORY_DATE,
                                SUM(ES.delivery_quantity) AS EXPORT_INVOICE_QUANTITY,
                                SUM(ES.delivery_quantity * SD.fob_rate) AS RDL_EXPORT_VALUE,
                                SUM(ES.delivery_quantity * SD.fob_rate / BO.currency_rate) AS RDL_EXPORT_VALUE_USD,
                                SUM(CASE 
                                    WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                        THEN ES.delivery_quantity * FSD.transfer_rate / BO.currency_rate
                                    ELSE ES.delivery_quantity * FSD.factory_rate / BO.currency_rate
                                END) AS FACTORY_EXPORT_VALUE,
                                SUM(ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) / BO.currency_rate) AS DEBIT_NOTE,
                                C.symbol
                            FROM lc_orders AS LO
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                            INNER JOIN buyer_orders AS BO ON BO.id = LO.order_id
                            INNER JOIN currencies AS C ON C.id = BO.secondary_currency_id
                            ${isPartial ? Prisma.sql`WHERE E.EXFACTORY_DATE BETWEEN ${input.from_date} AND ${input.to_date}` : Prisma.empty}
                            GROUP BY LO.lc_master_id, C.ID
                        ), 
                        PROCEED AS (
                            SELECT
                                DS.lc_id AS DS_LC_ID,
                                SUM(PRD.realized_amount) AS REALIZED_AMOUNT
                            FROM document_submissions AS DS
                            INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                            INNER JOIN proceed_realization_details AS PRD ON PRD.realization_id = PR.id
                            GROUP BY DS.lc_id
                        ),
                        FACTORY_PAYMENTS AS (
                            SELECT
                                DS.lc_id AS DS_LC_ID,
                                SUM(FP.paid_amount) AS FACTORY_PAID_AMOUNT
                            FROM document_submissions AS DS  
                                INNER JOIN factory_payments AS FP ON DS.id = FP.document_submission_id
                            GROUP BY DS.lc_id
                        )
                        SELECT	
                            E.MIN_EXFACTORY_DATE,
                            E.MAX_EXFACTORY_DATE,
                            E.EXPORT_INVOICE_QUANTITY,
                            E.RDL_EXPORT_VALUE,
                            E.RDL_EXPORT_VALUE_USD,
                            E.FACTORY_EXPORT_VALUE,
                            E.symbol,
                            E.DEBIT_NOTE,
                            p.REALIZED_AMOUNT,
                            F.FACTORY_PAID_AMOUNT
                        FROM lc_master AS LC
                            INNER JOIN EXFACTORY AS E ON E.E_LC_ID = LC.ID
                            INNER JOIN PROCEED AS P ON P.DS_LC_ID = LC.ID
                            INNER JOIN FACTORY_PAYMENTS AS F ON F.DS_LC_ID = LC.ID
                        WHERE LC.ID = ${input.lcScId}
                        GROUP BY LC.ID, 
                            E.MIN_EXFACTORY_DATE,
                            E.MAX_EXFACTORY_DATE,
                            E.EXPORT_INVOICE_QUANTITY,
                            E.RDL_EXPORT_VALUE,
                            E.RDL_EXPORT_VALUE_USD,
                            E.FACTORY_EXPORT_VALUE,
                            E.symbol,
                            E.DEBIT_NOTE,
                            p.REALIZED_AMOUNT,
                            F.FACTORY_PAID_AMOUNT;
                    `,

                    charges = await ctx.db.$queryRaw<Charges[]>`
                        SELECT
                            COALESCE(SUM(PR.bank_charge), 0) AS bank_charge,
                            COALESCE(SUM(PR.discount_charge), 0) AS discount_charge,
                            COALESCE(SUM(PR.document_charge), 0) AS document_charge
                        FROM document_submissions AS DS
                        INNER JOIN proceed_realization AS PR ON PR.document_submission_id = DS.id
                        WHERE DS.lc_id = ${input.lcScId};
                    `,

                    claimAdjustment = await ctx.db.$queryRaw<ClaimAdjustment[]>`
                        SELECT 
                            COALESCE(SUM(discount), 0) AS CLAIM_ADJUSTMENT
                        FROM rdl_invoice
                        WHERE lc_id = ${input.lcScId};
                    `,

                    debitNotes = await ctx.db.$queryRaw<DebitNotes[]>`
                        SELECT 
                            DN.debit_note_ref,
                            DN.debit_note_date,
                            SUM(ES.delivery_quantity * (FSD.TRANSFER_RATE - FSD.FACTORY_RATE)) AS DEBIT_NOTE_VALUE,
                            F.name AS FACTORY_NAME
                        FROM debit_note AS DN
                            INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                        WHERE DN.lc_id = ${input.lcScId};
                        GROUP BY DN.id, F.id;
                    `
                ]);

                const header = headerData.length > 0 ? {
                    lc_no: headerData[0]?.lc_no,
                    buyer_name: headerData[0]?.buyer_name,
                    quantity: quantityFormatter(safeNumber(headerData[0]?.order_quantity)),
                    value: currencyFormatter(safeNumber(headerData[0]?.value), '$'),
                    ...(headerData[0]?.symbol !== '$' && {
                        secondary_value: currencyFormatter(
                            safeNumber(headerData[0]?.secondary_value),
                            headerData[0]?.symbol ?? '$'
                        )
                    })
                } : null;

                const minYear = tableData[0]?.min_exfactory_date.toDateString().split('-')[0];
                const maxYear = tableData[0]?.max_exfactory_date.toDateString().split('-')[0];

                const invoicePeriod = minYear === maxYear ? minYear : `${minYear} - ${maxYear}`;

                const commission = safeNumber(tableData[0]?.rdl_export_value_usd) - safeNumber(tableData[0]?.factory_export_value);
                const commission_percentage = dividedByZeroSafe(commission, safeNumber(tableData[0]?.rdl_export_value_usd)) * 100;

                const commission_realized = safeNumber(tableData[0]?.realized_amount) - safeNumber(tableData[0]?.factory_paid_amount);
                const commission_realized_percentage = dividedByZeroSafe(commission_realized, safeNumber(tableData[0]?.factory_paid_amount)) * 100;

                const debit_note = safeNumber(tableData[0]?.debit_note);

                const total_calculated_commission = commission + debit_note; 
                const total_calculated_commission_percentage = dividedByZeroSafe(commission, total_calculated_commission) * 100;

                const total_commission_realized = commission_realized + debit_note;  
                const total_commission_realized_percentage = dividedByZeroSafe(commission_realized, total_commission_realized) * 100;

                const table = tableData.length > 0 ? {
                    invoice_period: invoicePeriod,
                    export_invoice_quantity: quantityFormatter(safeNumber(tableData[0]?.export_invoice_quantity)),
                    ...(tableData[0]?.symbol !== '$' && {
                        invoice_value: currencyFormatter(safeNumber(tableData[0]?.rdl_export_value), tableData[0]?.symbol ?? '$')
                    }),
                    invoice_value_usd: currencyFormatter(safeNumber(tableData[0]?.rdl_export_value_usd), '$'),
                    factory_export_value: currencyFormatter(safeNumber(tableData[0]?.factory_export_value), '$'),
                    calculated_commission: currencyFormatter(commission, '$'),
                    calculated_commission_percentage: `${quantityFormatter(commission_percentage)}%`,
                    proceed: currencyFormatter(safeNumber(tableData[0]?.realized_amount), '$'),
                    factory_payment: currencyFormatter(safeNumber(tableData[0]?.factory_paid_amount), '$'),
                    commission_realized: currencyFormatter(commission_realized, '$'),
                    commission_realized_percentage: `${quantityFormatter(commission_realized_percentage)}%`,
                    debit_note: currencyFormatter(debit_note, '$'),
                } : null;

                const table_summary = {
                    total_calculated_commission,
                    total_calculated_commission_percentage,
                    total_commission_realized,
                    total_commission_realized_percentage
                }

                const gain_lose = ( - (
                    safeNumber(tableData[0]?.rdl_export_value_usd) - safeNumber(tableData[0]?.realized_amount)
                ) - (
                    safeNumber(charges[0]?.bank_charge) + 
                    safeNumber(charges[0]?.document_charge) + 
                    safeNumber(charges[0]?.discount_charge) +
                    safeNumber(claimAdjustment[0]?.claim_adjustment)
                ));

                const reduction_in_factory_payment = safeNumber(tableData[0]?.factory_export_value) - safeNumber(tableData[0]?.factory_paid_amount);

                const chargesTable = {
                    bank_charge: currencyFormatter(safeNumber(charges[0]?.bank_charge), '$'),
                    document_charge: currencyFormatter(safeNumber(charges[0]?.document_charge), '$'),
                    discount_charge: currencyFormatter(safeNumber(charges[0]?.discount_charge), '$'),
                    claim_adjustment: currencyFormatter(safeNumber(claimAdjustment[0]?.claim_adjustment), '$'),
                    gain_lose: currencyFormatter(gain_lose, '$'),
                    reduction_in_factory_payment: currencyFormatter(reduction_in_factory_payment, '$')
                }

                const difference_between_commissions = currencyFormatter(total_calculated_commission - total_commission_realized, '$');

                return { 
                    header, 
                    table, 
                    table_summary, 
                    chargesTable,
                    difference_between_commissions
                }
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})