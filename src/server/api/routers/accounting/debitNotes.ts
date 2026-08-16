import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { amountToWords, currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";
import { amountToWordsBDT, currencyFormatterBDT } from "~/utils/localNumberStringBDT";
import type { LCListItem, ShipmentDetails, DebitNoteHeader, DebitNoteTableData } from './_types/debitNotes';

export const debitNotesRouter = createTRPCRouter({
    getAllDebitNotes: protectedProcedure
        .input(z.object({
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input}) => {
            const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to view debit notes."
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<LCListItem[]>`
                    WITH DEBIT_NOTES AS (	
                        SELECT DISTINCT
                            DN.id,
                            F.NAME AS FACTORY_NAME,
                            DN.DEBIT_NOTE_REF,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN T.NAME = 'TT'
                                    THEN SC.SALES_CONTRACT_NO
                                ELSE LC.LC_NO
                            END AS LC_SC_NO,
                            B.BUYER_NAME,
                            DN.DEBIT_NOTE_DATE,
                            DN.ADDED_AT
                        FROM DEBIT_NOTE AS DN
                            INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                            LEFT JOIN lc_shipments AS LS ON LS.shipment_details_id = ES.shipment_detailS_id
                            LEFT JOIN lc_orders AS LO ON LO.id = LS.lc_order_id
                            LEFT JOIN lc_master AS LC ON LC.id = LO.lc_master_id
                            LEFT JOIN shipment_details AS SD ON SD.id = ES.shipment_detailS_id
                            LEFT JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            LEFT JOIN sales_contract_details AS SCS ON SCS.order_id = OS.order_id
                            LEFT JOIN sales_contracts AS SC ON SC.id = SCS.sales_contract_id
                            INNER JOIN BUYERS AS B ON B.id = DN.buyer_id
                            INNER JOIN TERMS AS T ON T.ID = DN.term_id
                        WHERE EXISTS ( -- Admin
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
                            WHERE T.BUYER_ID = B.ID
                                AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    SELECT *, 
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM DEBIT_NOTES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const debitNotes = result.map(({ total_count: _, ...invoice}) => invoice);

                return {debitNotes, total};
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchDebitNotes: protectedProcedure
        .input(z.object({
            query: z.string(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to view debit notes."
                });
            }
            
            try {
                const result = await ctx.db.$queryRaw<LCListItem[]>`
                    WITH DEBIT_NOTES AS (	
                        SELECT DISTINCT
                            DN.id,
                            F.NAME AS FACTORY_NAME,
                            DN.DEBIT_NOTE_REF,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN T.NAME = 'TT'
                                    THEN SC.SALES_CONTRACT_NO
                                ELSE LC.LC_NO
                            END AS LC_SC_NO,
                            B.BUYER_NAME,
                            DN.DEBIT_NOTE_DATE,
                            DN.ADDED_AT
                        FROM DEBIT_NOTE AS DN
                            INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                            LEFT JOIN lc_shipments AS LS ON LS.shipment_details_id = ES.shipment_detailS_id
                            LEFT JOIN lc_orders AS LO ON LO.id = LS.lc_order_id
                            LEFT JOIN lc_master AS LC ON LC.id = LO.lc_master_id
                            LEFT JOIN shipment_details AS SD ON SD.id = ES.shipment_detailS_id
                            LEFT JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            LEFT JOIN sales_contract_details AS SCS ON SCS.order_id = OS.order_id
                            LEFT JOIN sales_contracts AS SC ON SC.id = SCS.sales_contract_id
                            INNER JOIN BUYERS AS B ON B.id = DN.buyer_id
                            INNER JOIN TERMS AS T ON T.ID = DN.term_id
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
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            F.NAME ILIKE '%' || ${input.query} || '%'
                            OR DN.DEBIT_NOTE_REF ILIKE '%' || ${input.query} || '%'
                            OR LC.LC_NO ILIKE '%' || ${input.query} || '%'
                            OR SC.SALES_CONTRACT_NO ILIKE '%' || ${input.query} || '%'
                            OR SD.BUYER_PO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT *, 
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM DEBIT_NOTES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit ?? 15}
                    OFFSET ${input.offset ?? 0};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const debitNotes = result.map(({ total_count: _, ...invoice}) => invoice);

                return {debitNotes, total};
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteDebitNote: protectedProcedure
        .input(z.object({
            debit_note_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.DEBIT_NOTE]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to delete debit notes."
                });
            }
            
            try {
                const deletedDebitNote = await ctx.db.$transaction(async (db) => {
                    // Delete associated debit note details first
                    const deletedDetails = await db.debit_note_details.findMany({
                        where: { debit_note_header_id: input.debit_note_id },
                    });

                    await db.debit_note_details.deleteMany({
                        where: { debit_note_header_id: input.debit_note_id },
                    });

                    await db.debit_note_details_history.createMany({
                        data: deletedDetails.map(detail => ({
                            debit_note_header_id: detail.debit_note_header_id,
                            exfactory_shipment_id: detail.exfactory_shipment_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        })),
                    });

                    const deletedHeader = await db.debit_note.delete({
                        where: { id: input.debit_note_id },
                    });

                    await db.debit_note_history.create({
                        data: {
                            additional_adjustment: deletedHeader.additional_adjustment,
                            buyer_id: deletedHeader.buyer_id,
                            conversion_rate: deletedHeader.conversion_rate,
                            debit_note_date: deletedHeader.debit_note_date,
                            debit_note_ref: deletedHeader.debit_note_ref,
                            less: deletedHeader.less,
                            debit_note_id: deletedHeader.id,
                            processing_charge: deletedHeader.processing_charge,
                            sales_contract_id: deletedHeader.sales_contract_id,
                            lc_id: deletedHeader.lc_id,
                            term_id: deletedHeader.term_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return deletedHeader;
                });
                
                return deletedDebitNote;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getLCScForDebitNotes: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                const isTT = terms.name.toLowerCase() === 'tt';

                let lcScList: { lc_sc_id: string; sc_lc_no: string }[];

                if (isTT) {
                    lcScList = await ctx.db.$queryRaw<{ lc_sc_id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            SC.ID AS lc_sc_id,
                            SC.sales_contract_no AS sc_lc_no
                        FROM sales_contracts AS SC 
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN order_styles AS SO ON SO.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = SO.id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.exfactory_shipment_id = ES.ID
                            )
                            AND SC.buyer_id = ${input.buyer_id}
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
                                    WHERE T.BUYER_ID = SC.BUYER_ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            );
                        `;
                }
                else {
                    lcScList = await ctx.db.$queryRaw<{ lc_sc_id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            LC.ID AS lc_sc_id,
                            LC.LC_NO AS sc_lc_no
                        FROM LC_MASTER AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = LS.shipment_details_id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.exfactory_shipment_id = ES.ID
                            )
                            AND LC.buyer_id = ${input.buyer_id}
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
                                    WHERE T.BUYER_ID = LC.BUYER_ID
                                        AND TM.USER_ID = ${ctx.user.id}
                                )
                            );
                    `;
                }

                return lcScList;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    addDebitNote: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            dn_date: z.date(),
            factory_id: z.number(),
            buyer_id: z.number(),
            lc_sc_id: z.string(),
            less: z.number().optional(),
            processing_charges: z.number().optional(),
            conversion_rate: z.number().optional(),
            additional_charges: z.number().optional(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                exfactory_shipment_id: z.string(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.DEBIT_NOTE]?.can_add;

            if(!can_add) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to add debit notes."
                });
            }
            
            try {
                const currentYear = new Date().getFullYear();

                const meta = await ctx.db.debit_note_metadata.upsert({
                    where: { buyer_id_year: { buyer_id: input.buyer_id, year: currentYear } },
                    update: {
                        last_ref: {
                            increment: 1,
                        },
                    },
                    create: {
                        year: currentYear,
                        last_ref: 1,
                    },
                });
                
                const buyer_prefix = await ctx.db.buyers.findUnique({
                    where: { id: input.buyer_id },
                    select: { prefix: true },
                });

                if(!buyer_prefix) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: "Buyer prefix not found."
                    });
                }

                const factory_prefix = await ctx.db.factories.findUnique({
                    where: { id: input.factory_id },
                    select: { prefix: true },
                });

                if(!factory_prefix) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: "Factory prefix not found."
                    });
                }

                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                const isTT = terms.name.toLowerCase() === 'tt'

                const debitNotes= await ctx.db.$transaction(async (tx) => {
                    const dn_ref = `DBN/${buyer_prefix?.prefix}/${factory_prefix?.prefix}/${String((meta?.last_ref ?? 0)).padStart(4, '0')}`;

                    const debitNoteHeader = await tx.debit_note.create({
                        data: {
                            term_id: input.term_id,
                            debit_note_date: input.dn_date,
                            factory_id: input.factory_id,
                            debit_note_ref: dn_ref,
                            buyer_id: input.buyer_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            less: input.less,
                            processing_charge: input.processing_charges,
                            conversion_rate: input.conversion_rate,
                            additional_adjustment: input.additional_charges,
                            remarks: input.remarks,
                        },
                    });

                    await tx.debit_note_history.create({
                        data: {
                            debit_note_id: debitNoteHeader.id,
                            additional_adjustment: input.additional_charges,
                            buyer_id: input.buyer_id,
                            conversion_rate: input.conversion_rate,
                            debit_note_date: input.dn_date,
                            debit_note_ref: dn_ref,
                            lc_id: input.lc_sc_id,
                            less: input.less,
                            processing_charge: input.processing_charges,
                            remarks: input.remarks,
                            sales_contract_id: input.lc_sc_id,
                            term_id: input.term_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        const debitNoteDetails = input.details.map(detail => ({
                            debit_note_header_id: debitNoteHeader.id,
                            exfactory_shipment_id: detail.exfactory_shipment_id,
                        }));
                        await tx.debit_note_details.createMany({
                            data: debitNoteDetails,
                        });
                    }

                    return debitNoteHeader;
                }, {timeout: 30000});

                const newDebitNoteDetails = await ctx.db.debit_note_details.findMany({
                    where: { debit_note_header_id: debitNotes.id },
                });

                await ctx.db.debit_note_details_history.createMany({
                    data: newDebitNoteDetails?.map(detail => ({
                        debit_note_header_id: detail.debit_note_header_id,
                        exfactory_shipment_id: detail.exfactory_shipment_id,
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    })) ?? [],
                });

                return debitNotes;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getShipmentDetailsForDebitNote: protectedProcedure
        .input(z.object({
            lc_sc_id: z.string(),
            term_id: z.number(),
            factory_id: z.number(),
            debit_note_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                const isTT = terms.name.toLowerCase() === 'tt';

                let shipmentDetails: ShipmentDetails[];

                const addExistingDNCondition = input.debit_note_id 
                    ? Prisma.sql`AND DND.debit_note_header_id <> ${input.debit_note_id}` 
                    : Prisma.empty;

                if (isTT) {
                    shipmentDetails = await ctx.db.$queryRaw<ShipmentDetails[]>`
                        SELECT
                            ES.id,
                            SD.buyer_po,
                            FI.invoice_no,
                            ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) AS dn_value
                        FROM sales_contracts AS SC
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN order_styles AS SO ON SO.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = SO.id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM debit_note_details AS DND
                            WHERE DND.exfactory_shipment_id = ES.ID
                                ${addExistingDNCondition}
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM factory_payments AS FP
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FP.factory_invoice_id
                            WHERE FID.exfactory_shipment_id = ES.id
                        )
                        AND FSD.factory_rate <> FSD.transfer_rate
                        AND SC.id = ${input.lc_sc_id}
                        AND FI.factory_id = ${input.factory_id}
                        ORDER BY SD.added_at DESC;
                    `;
                }
                else {
                    shipmentDetails = await ctx.db.$queryRaw<ShipmentDetails[]>`
                        SELECT
                            ES.id,
                            SD.buyer_po,
                            FI.invoice_no,
                            ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) AS dn_value
                        FROM lc_master AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM debit_note_details AS DND
                            WHERE DND.exfactory_shipment_id = ES.ID
                                ${addExistingDNCondition}
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM factory_payments AS FP
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FP.factory_invoice_id
                            WHERE FID.exfactory_shipment_id = ES.id
                        )
                        AND FSD.factory_rate <> FSD.transfer_rate
                        AND LC.id = ${input.lc_sc_id}
                        AND FI.factory_id = ${input.factory_id}
                        ORDER BY SD.added_at DESC;
                    `;
                }

                return shipmentDetails;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteShipment: protectedProcedure
        .input(z.object({
            db_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.DEBIT_NOTE]?.can_delete;

            if(!can_delete) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to delete debit note shipments."
                });
            }
            
            try {
                const deletedShipment = await ctx.db.$transaction(async (db) => {
                    const deletedDetail = await db.debit_note_details.findUnique({
                        where: { id: input.db_id },
                    });

                    if (!deletedDetail) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: "Debit note shipment not found."
                        });
                    }

                    await db.debit_note_details.delete({
                        where: { id: input.db_id },
                    });

                    await db.debit_note_details_history.create({
                        data: {
                            debit_note_header_id: deletedDetail.debit_note_header_id,
                            exfactory_shipment_id: deletedDetail.exfactory_shipment_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return deletedDetail;
                })
          
                return deletedShipment;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getDebitNoteById: protectedProcedure
        .input(z.object({
            debit_note_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to view debit notes."
                });
            }
            
            try {
                const debitNoteObj = await ctx.db.debit_note.findUnique({
                    where: { id: input.debit_note_id },
                    select: {
                        id: true,
                        term_id: true,
                        debit_note_date: true,
                        factory_id: true,
                        debit_note_ref: true,
                        buyer_id: true,
                        lc_id: true,
                        sales_contract_id: true,
                        lc_master: {
                            select: {
                                lc_no: true,
                            }
                        },
                        sales_contracts: {
                            select: {
                                sales_contract_no: true,
                            }
                        },
                        less: true,
                        processing_charge: true,
                        conversion_rate: true,
                        additional_adjustment: true,
                        remarks: true,
                        debit_note_details: {
                            select: {
                                id: true,
                                exfactory_shipment_id: true,
                            },
                        },
                    },
                });

                if (!debitNoteObj) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: "Debit note not found."
                    });
                }

                const debitNotePoDetails = await ctx.db.$queryRaw<ShipmentDetails[]>`
                    SELECT
                        ES.id,
                        SD.buyer_po,
                        FI.invoice_no,
                        ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate) AS dn_value
                    FROM debit_note_details AS DND
                        INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                        INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                        INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                        INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                    WHERE DND.debit_note_header_id = ${input.debit_note_id}
                    ORDER BY SD.added_at DESC;
                `;

                const debitNote = {
                    db_id: debitNoteObj.id,
                    term_id: debitNoteObj.term_id,
                    dn_date: debitNoteObj.debit_note_date,
                    factory_id: debitNoteObj.factory_id,
                    dn_ref: debitNoteObj.debit_note_ref,
                    buyer_id: debitNoteObj.buyer_id,
                    lc_sc_id: debitNoteObj.lc_id ?? debitNoteObj.sales_contract_id,
                    lc_sc_no: debitNoteObj.lc_master?.lc_no ?? debitNoteObj.sales_contracts?.sales_contract_no ?? '',
                    less: debitNoteObj.less,
                    processing_charges: debitNoteObj.processing_charge,
                    conversion_rate: debitNoteObj.conversion_rate,
                    additional_charges: debitNoteObj.additional_adjustment,
                    remarks: debitNoteObj.remarks,
                    details: debitNoteObj.debit_note_details.map(detail => ({
                        db_id: detail.id,
                        exfactory_shipment_id: detail.exfactory_shipment_id,
                        po_no: debitNotePoDetails.find(poDetail => poDetail.id === detail.exfactory_shipment_id)?.buyer_po ?? '',
                        factory_invoice_no: debitNotePoDetails.find(poDetail => poDetail.id === detail.exfactory_shipment_id)?.invoice_no ?? '',
                        value: debitNotePoDetails.find(poDetail => poDetail.id === detail.exfactory_shipment_id)?.dn_value ?? 0,
                    })),
                };

                return debitNote;
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateDebitNote: protectedProcedure
        .input(z.object({
            id: z.string(),
            dn_date: z.date(),
            less: z.number().optional(),
            processing_charges: z.number().optional(),
            conversion_rate: z.number().optional(),
            additional_charges: z.number().optional(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                db_id: z.string().optional(),
                exfactory_shipment_id: z.string(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.DEBIT_NOTE]?.can_update;

            if(!can_update) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: "You do not have permission to update debit notes."
                });
            }
            
            try {
                return await ctx.db.$transaction(async (db) => {
                    const updatedHeader = await db.debit_note.update({
                        where: { id: input.id },
                        data: {
                            debit_note_date: input.dn_date,
                            less: input.less,
                            processing_charge: input.processing_charges,
                            conversion_rate: input.conversion_rate,
                            additional_adjustment: input.additional_charges,
                            remarks: input.remarks,
                        },
                    });

                    await db.debit_note_history.create({
                        data: {
                            additional_adjustment: input.additional_charges,
                            conversion_rate: input.conversion_rate,
                            debit_note_date: input.dn_date,
                            debit_note_id: input.id,
                            less: input.less,
                            processing_charge: input.processing_charges,
                            remarks: input.remarks,
                            debit_note_ref: updatedHeader.debit_note_ref,
                            lc_id: updatedHeader.lc_id,
                            sales_contract_id: updatedHeader.sales_contract_id,
                            buyer_id: updatedHeader.buyer_id,
                            term_id: updatedHeader.term_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        for (const detail of input.details) {
                            if (!detail.db_id) {
                                await db.debit_note_details.create({
                                    data: {
                                        debit_note_header_id: input.id,
                                        exfactory_shipment_id: detail.exfactory_shipment_id,
                                    },
                                });
                            }
        
                            await db.debit_note_details_history.create({
                                data: {
                                    debit_note_header_id: input.id,
                                    exfactory_shipment_id: detail.exfactory_shipment_id,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    return updatedHeader;
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    getPDFData: protectedProcedure
        .input(z.object({
            debit_note_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

            if(!can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Debit Note'
                })
            }
            
            try {
                let headerData: DebitNoteHeader[];
                let table: DebitNoteTableData[];
                let factoryInvoices: { factory_invoices: string }[];

                await Promise.all([
                    headerData = await ctx.db.$queryRaw<DebitNoteHeader[]>`
                        SELECT 
                            DN.debit_note_ref,
                            DN.debit_note_date,
                            F.NAME AS factory_name,
                            F.factory_address,
                            COALESCE(DN.processing_charge, 0) AS processing_charge,
                            DN.conversion_rate,
                            COALESCE(DN.additional_adjustment, 0) AS additional_adjustment,
                            COALESCE(DN.less, 0) AS less,
                            LC.lc_no,
                            LC.lc_open_date
                        FROM debit_note AS DN
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                            LEFT JOIN lc_master AS LC ON LC.id = DN.lc_id
                        WHERE DN.ID = ${input.debit_note_id};
                    `,

                    table = await ctx.db.$queryRaw<DebitNoteTableData[]>`
                        SELECT 
                            SD.buyer_po,
                            ES.delivery_quantity AS QUANTITY,
                            FSD.factory_rate,
                            FSD.transfer_rate,
                            (FSD.transfer_rate - FSD.factory_rate)::NUMERIC(18, 2) AS MARGIN,
                            (ES.delivery_quantity * (FSD.transfer_rate - FSD.factory_rate))::NUMERIC(18, 2) AS EXCESS_VALUE,
                            C.SYMBOL
                        FROM DEBIT_NOTE_DETAILS AS DND
                            INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                            INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN factory_orders AS FO ON FO.id = FSD.factory_order_id
                            INNER JOIN CURRENCIES AS C ON C.id = FO.currency_id
                        WHERE DND.debit_note_header_id = ${input.debit_note_id}
                    `,

                    factoryInvoices = await ctx.db.$queryRaw<{ factory_invoices: string }[]>`
                        SELECT DISTINCT 
                            FI.invoice_no AS FACTORY_INVOICES
                        FROM DEBIT_NOTE_DETAILS AS DND
                            INNER JOIN exfactory_shipments AS ES ON ES.id = DND.exfactory_shipment_id
                            INNER JOIN shipment_details AS SD ON SD.id = ES.shipment_details_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                        WHERE DND.debit_note_header_id = ${input.debit_note_id};
                    `
                ]);


                const formattedTable = table.map(item => ({
                    buyer_po: item.buyer_po,
                    quantity: quantityFormatter(item.quantity),
                    factory_rate: currencyFormatter(item.factory_rate, item.symbol),
                    transfer_rate: currencyFormatter(item.transfer_rate, item.symbol),
                    margin: currencyFormatter(item.margin, item.symbol),
                    excess_value: currencyFormatter(item.excess_value, item.symbol),
                }));

                const totalQuantity = table.reduce((total, item) => total = safeNumber(item.quantity) + total, 0);
                const totalValue = table.reduce((total, item) => total = total + safeNumber(item.excess_value), 0);

                const paymentAdjustmentValue = totalValue * (headerData[0]?.additional_adjustment ?? 0) / 100;
                const processingChargeValue = totalValue * (headerData[0]?.processing_charge ?? 0) / 100;
                const lessValue = safeNumber(headerData[0]?.less);
                const initialTotal = totalValue - lessValue;
                const grandTotal = totalValue - paymentAdjustmentValue - processingChargeValue - lessValue;
                const inBDT = grandTotal * (headerData[0]?.conversion_rate ?? 1);

                const totals = {
                    totalQuantity: quantityFormatter(totalQuantity),
                    totalValue: currencyFormatter(totalValue, table[0]?.symbol || table[0]?.symbol || '$'),
                    lessValue: currencyFormatter(lessValue, table[0]?.symbol || table[0]?.symbol || '$'),
                    paymentAdjustmentValue: currencyFormatter(paymentAdjustmentValue, table[0]?.symbol || table[0]?.symbol || '$'),
                    processingChargeValue: currencyFormatter(processingChargeValue, table[0]?.symbol || table[0]?.symbol || '$'),
                    initialTotal: currencyFormatter(initialTotal, table[0]?.symbol || table[0]?.symbol || '$'),
                    grandTotal: currencyFormatter(grandTotal, table[0]?.symbol || table[0]?.symbol || '$'),
                    inWord: amountToWords(grandTotal),
                    inBDT: currencyFormatterBDT(inBDT, 'BDT'),
                    inWordBDT: amountToWordsBDT(inBDT),
                }

                return { headerData, formattedTable, totals, factoryInvoices };
            }
            catch(error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})

