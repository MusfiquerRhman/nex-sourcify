import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, type Prisma, type PrismaClient, type users } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { getPPMeetingOrderAccess as getOrderAccess } from "~/server/_utils/ppMeetingAccess";
import { technicalCheckSchema } from "~/utils/orderChecklist";

const checkListArray = [
    { document_details: 'Risk Assessment Report' },
    { document_details: 'PO Sheets Including Shipment Date (Seal & Signature)' },
    { document_details: 'Style Description' },
    { document_details: 'Specification/Technical Sheet' },
    { document_details: 'Updated Measurement List spec With Tolerance' },
    { document_details: 'Print/ EMB Placement / Grading' },
    { document_details: 'Red Seal / PP Comments (Customer + Nex-Sourcify)' },
    { document_details: 'Trim Check List (BOM/LOF)' },
    { document_details: 'Approved Care label Layout' },
    { document_details: 'Packing List Layout' },
    { document_details: 'Packing & Packaging Details' },
    { document_details: 'Trim Card With Size Wise Trim If it is Different (Each Trim Do Seal Half of The Trim)' },
    { document_details: 'Approved Fabric Hanger (Form Bulk Fabric)/ Approved Wash LEG Panel' },
    { document_details: 'Approved Shade Continuity Card For Bulk Fabric' },
    { document_details: 'Approved GSM Board With Fabric Packing List' },
    { document_details: 'Approved Print / EMB Strike Off' },
    { document_details: 'Sealed & Signed Sample (PPS)' },
    { document_details: 'Data sheet (Fusing/Button)' },
    { document_details: '3rd Party- Fabric Test Report (If Applicable)/ Nex-Sourcify-Fabric Wash Test Report' },
    { document_details: 'Important E-mails' },
    { document_details: 'TNA' },
    { document_details: 'Wash Yes/No' },
];

const getChecklist = (id: string) => {
    return checkListArray.map((item, index) => ({
        ...item,
        serial_no: index + 1,
        order_checklist_id: id
    }));
}

type ChecklistUser = Pick<users, 'id' | 'department_id' | 'level_id'>;

const getChecklistAccess = (user: ChecklistUser): Prisma.order_checklistWhereInput => {
    if (user.department_id === ADMIN_DEPARTMENT_ID && user.level_id === ADMIN_LEVEL_ID) return {};

    return {
        buyers: {
            teams: {
                some: { team_members: { some: { user_id: user.id } } },
            },
        },
    };
};

const checklistSelect = {
    id: true,
    status: true,
    buyers: { select: { buyer_name: true } },
    buyer_orders: { select: { ref_no: true, factories: { select: { name: true } } } },
    order_styles: { select: { style: true } },
    shipment_details: { select: { buyer_po: true } },
} satisfies Prisma.order_checklistSelect;

const getChecklistWithDetails = (db: PrismaClient, user: ChecklistUser, id: string) => {
    return db.order_checklist.findFirstOrThrow({
        where: { id, ...getChecklistAccess(user) },
        select: {
            ...checklistSelect,
            buyer_id: true,
            order_id: true,
            style_id: true,
            shipment_id: true,
            order_checklist_details: { orderBy: { serial_no: 'asc' } },
        },
    });
};

const paginationSchema = z.object({
    limit: z.number().int().min(1).max(100).default(15),
    offset: z.number().int().min(0).default(0),
});

const getOrderChecklistList = async (db: PrismaClient, user: ChecklistUser, input: z.infer<typeof paginationSchema> & { query?: string }) => {
    const query = input.query?.trim();
    const where: Prisma.order_checklistWhereInput = {
        ...getChecklistAccess(user),
        ...(query ? {
            OR: [
                { buyers: { buyer_name: { contains: query, mode: 'insensitive' } } },
                { buyer_orders: { ref_no: { contains: query, mode: 'insensitive' } } },
                { order_styles: { style: { contains: query, mode: 'insensitive' } } },
                { shipment_details: { buyer_po: { contains: query, mode: 'insensitive' } } },
                { buyer_orders: { factories: { name: { contains: query, mode: 'insensitive' } } } },
            ],
        } : {}),
    };

    const [records, total] = await Promise.all([
        db.order_checklist.findMany({
            where,
            select: checklistSelect,
            orderBy: [{ added_at: 'desc' }, { id: 'desc' }],
            take: input.limit,
            skip: input.offset,
        }),
        db.order_checklist.count({ where }),
    ]);

    const orderChecklists = records.map((record) => ({
        id: record.id,
        buyer_name: record.buyers.buyer_name,
        ref_no: record.buyer_orders.ref_no,
        style: record.order_styles.style,
        po: record.shipment_details.buyer_po,
        factory_name: record.buyer_orders.factories.name,
    }));

    return { orderChecklists, total };
};

export const orderChecklistRouter = createTRPCRouter({
    getOrderChecklists: protectedProcedure
        .input(paginationSchema)
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Order Checklists.' 
                });
            }

            return getOrderChecklistList(ctx.db, ctx.user, input);
        }),

    searchOrderChecklists: protectedProcedure
        .input(paginationSchema.extend({ query: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Order Checklists.' 
                });
            }

            return getOrderChecklistList(ctx.db, ctx.user, input);
        }),

    getOrderChecklistById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view Order Checklist.' 
                });
            }

            try {
                const checklist = await getChecklistWithDetails(ctx.db, ctx.user, input.id);

                return {
                    id: checklist.id,
                    buyer_id: checklist.buyer_id,
                    order_id: checklist.order_id,
                    style_id: checklist.style_id,
                    shipment_id: checklist.shipment_id,
                    buyer_name: checklist.buyers.buyer_name,
                    ref_no: checklist.buyer_orders.ref_no,
                    style: checklist.order_styles.style,
                    po: checklist.shipment_details.buyer_po,
                    factory_name: checklist.buyer_orders.factories.name,
                    details: checklist.order_checklist_details,
                    status: checklist.status,
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getPDFData: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_view) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to view Order Checklist.' });
            }

            try {
                const checklist = await getChecklistWithDetails(ctx.db, ctx.user, input.id);

                return {
                    header: [{
                        buyer_name: checklist.buyers.buyer_name,
                        ref_no: checklist.buyer_orders.ref_no,
                        style: checklist.order_styles.style,
                        po: checklist.shipment_details.buyer_po,
                        factory_name: checklist.buyer_orders.factories.name,
                    }],
                    details: checklist.order_checklist_details,
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrdersForChecklist: protectedProcedure
        .input(z.object({
            buyerId: z.number()
        }))
        .query(async ({ctx, input}) => {
            return await ctx.db.buyer_orders.findMany({
                where: {
                    buyer_id: input.buyerId,
                    order_checklist: {
                        none: {},
                    },
                },
                select: {
                    id: true,
                    ref_no: true,
                },
            });
        }),

    getStyleForOrderChecklist: protectedProcedure
        .input(z.object({
            buyerId: z.number().int().positive()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_add) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to add File Review Checklists.' });
            }

            return await ctx.db.order_styles.findMany({
                where: {
                    buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyerId },
                    order_checklist: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    style: true,
                    order_id: true,
                    buyer_orders: { select: { ref_no: true, factories: { select: { name: true } } } },
                },
                orderBy: [{ style: 'asc' }, { buyer_orders: { ref_no: 'asc' } }, { serial: 'asc' }],
            })
        }),
    
    getShipmentForOrderChecklist: protectedProcedure
        .input(z.object({
            styleId: z.string().uuid()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_add) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to add File Review Checklists.' });
            }

            return await ctx.db.shipment_details.findMany({
                where: {
                    order_style_id: input.styleId,
                    order_styles: {
                        buyer_orders: getOrderAccess(ctx.user),
                        order_checklist: { none: {} },
                    },
                    order_checklist: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    buyer_po: true
                }
            })
        }),

    addOrderChecklist: protectedProcedure
        .input(z.object({
            buyer_id: z.number().int().positive("Buyer is required"),
            order_id: z.string().uuid("Order is required"),
            style_id: z.string().uuid("Style is required"),
            shipment_id: z.string().uuid("PO is required"),
            status: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.ORDER_CHECKLIST]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to add Order Checklist.'
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    await tx.$queryRaw`SELECT id FROM order_styles WHERE id = ${input.style_id}::uuid FOR UPDATE`;
                    const style = await tx.order_styles.findFirst({
                        where: {
                            id: input.style_id,
                            order_id: input.order_id,
                            buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyer_id },
                            order_checklist: { none: {} },
                        },
                        select: { id: true },
                    });
                    if (!style) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This style is unavailable for a File Review Checklist. Refresh the buyer and style selections.' });
                    }

                    const shipment = await tx.shipment_details.findFirst({
                        where: { id: input.shipment_id, order_style_id: style.id, order_checklist: { none: {} } },
                        select: { id: true },
                    });
                    if (!shipment) {
                        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select an available PO belonging to the selected style.' });
                    }

                    const orderChecklist = await tx.order_checklist.create({
                        data: {
                            buyer_id: input.buyer_id,
                            order_id: input.order_id,
                            style_id: input.style_id,
                            shipment_id: input.shipment_id,
                            status: input.status,
                        }
                    });

                    await tx.order_checklist_details.createMany({
                        data: getChecklist(orderChecklist.id)
                    });

                    await tx.order_checklist_history.create({
                        data: {
                            order_checklist_id: orderChecklist.id,
                            buyer_id: orderChecklist.buyer_id,
                            order_id: orderChecklist.order_id,
                            style_id: orderChecklist.style_id,
                            shipment_id: orderChecklist.shipment_id,
                            status: orderChecklist.status,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED
                        }
                    });

                    return orderChecklist.id;
                })
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateOrderChecklist: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
            status: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
            details: z.array(z.object({
                id: z.string().uuid(),
                technical_check: technicalCheckSchema,
                technical_remarks: z.string().optional(),
                technical_check_date: z.string().date().or(z.literal('')),
                qa_check: z.boolean(),
                qa_remarks: z.string().optional(),
                qa_check_date: z.string().date().or(z.literal('')),
            }).strict().superRefine((detail, ctx) => {
                if (detail.technical_check === 1 && !detail.technical_check_date) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['technical_check_date'], message: 'Technical check date is required' });
                }

                if (detail.qa_check && !detail.qa_check_date) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['qa_check_date'], message: 'QA check date is required' });
                }
            })).min(1),
        }).strict())
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_update) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to update Order Checklist.'
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const checklist = await tx.order_checklist.findFirstOrThrow({
                        where: { 
                            id: input.id, 
                            ...getChecklistAccess(ctx.user) 
                        },
                        include: { 
                            order_checklist_details: true 
                        },
                    });

                    const detailIds = new Set(input.details.map((detail) => detail.id));
                    const existingDetails = checklist.order_checklist_details.filter((detail) => detailIds.has(detail.id));

                    if (detailIds.size !== input.details.length || existingDetails.length !== detailIds.size) {
                        throw new TRPCError({ 
                            code: 'BAD_REQUEST', 
                            message: 'Each detail must belong to this Order Checklist and appear only once.' 
                        });
                    }

                    await Promise.all(
                        input.details.map((detail) => tx.order_checklist_details.update({
                            where: { id: detail.id, order_checklist_id: input.id },
                            data: {
                                technical_check: detail.technical_check,
                                technical_remarks: detail.technical_remarks,
                                technical_check_date: detail.technical_check === 1 ? new Date(detail.technical_check_date) : null,
                                qa_check: detail.qa_check,
                                qa_remarks: detail.qa_remarks,
                                qa_check_date: detail.qa_check ? new Date(detail.qa_check_date) : null,
                            },
                        }))
                    );

                    await tx.order_checklist.update({
                        where: { id: input.id },
                        data: { status: input.status },
                    });

                    await tx.order_checklist_history.create({
                        data: {
                            order_checklist_id: checklist.id,
                            buyer_id: checklist.buyer_id,
                            order_id: checklist.order_id,
                            style_id: checklist.style_id,
                            shipment_id: checklist.shipment_id,
                            status: input.status,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        },
                    });

                    await tx.order_checklist_details_history.createMany({
                        data: existingDetails.map((detail) => ({
                            order_checklist_details_id: detail.id,
                            order_checklist_id: detail.order_checklist_id,
                            serial_no: detail.serial_no,
                            document_details: detail.document_details,
                            technical_check: detail.technical_check,
                            technical_remarks: detail.technical_remarks,
                            technical_check_date: detail.technical_check_date,
                            qa_check: detail.qa_check,
                            qa_remarks: detail.qa_remarks,
                            qa_check_date: detail.qa_check_date,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        })),
                    });

                    return checklist.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteOrderChecklist: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.ORDER_CHECKLIST]?.can_delete) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to delete Order Checklist.' 
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const checklist = await tx.order_checklist.findFirstOrThrow({
                        where: { 
                            id: input.id, 
                            ...getChecklistAccess(ctx.user) 
                        },
                        include: {
                            order_checklist_details: true 
                        },
                    });

                    // Preserve snapshots while releasing the history foreign keys before deleting details.
                    await tx.order_checklist_details_history.updateMany({
                        where: { 
                            order_checklist_details_id: { 
                                in: checklist.order_checklist_details.map((detail) => detail.id) 
                            } 
                        },
                        data: { 
                            order_checklist_details_id: null 
                        },
                    });

                    await tx.order_checklist_details.deleteMany({ 
                        where: { 
                            order_checklist_id: input.id 
                        } 
                    });

                    await tx.order_checklist.delete({ 
                        where: { 
                            id: input.id 
                        } 
                    });

                    await tx.order_checklist_details_history.createMany({
                        data: checklist.order_checklist_details.map((detail) => ({
                            order_checklist_details_id: null,
                            order_checklist_id: detail.order_checklist_id,
                            serial_no: detail.serial_no,
                            document_details: detail.document_details,
                            technical_check: detail.technical_check,
                            technical_remarks: detail.technical_remarks,
                            technical_check_date: detail.technical_check_date,
                            qa_check: detail.qa_check,
                            qa_remarks: detail.qa_remarks,
                            qa_check_date: detail.qa_check_date,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                        })),
                    });

                    await tx.order_checklist_history.create({
                        data: {
                            order_checklist_id: checklist.id,
                            buyer_id: checklist.buyer_id,
                            order_id: checklist.order_id,
                            style_id: checklist.style_id,
                            shipment_id: checklist.shipment_id,
                            action_by: ctx.user.id,
                            action_type: actions.DELETE,
                        },
                    });

                    return checklist.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
})
