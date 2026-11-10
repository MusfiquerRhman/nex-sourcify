import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, type Prisma } from "@prisma/client";
import { getPPMeetingOrderAccess as getOrderAccess } from "~/server/_utils/ppMeetingAccess";

const checkList = [
    { status_name: 'PP sample approved?' },
    { status_name: 'Green/Yellow seal tag attach?' },
    { status_name: 'Trims card approved?' },
    { status_name: 'Approved Shade band available?' },
    { status_name: 'Approved Spec/Measurement sheet available?' },
    { status_name: 'Approved Folding method available?' },
    { status_name: 'Approved Packaging method available?' },
    { status_name: 'Risk Assessment/ LRM Comment available?' },
    { status_name: 'Size Set Wash Test Result?' },
];

const getChecklist = (id: string) => {
    return checkList.map((item) => ({
        ...item,
        pre_production_meeting_id: id
    }));
}

export const ppMeetingRouter = createTRPCRouter({
    getPPMeetings: protectedProcedure
        .input(z.object({
            limit: z.number().int().min(1).max(100).default(15),
            offset: z.number().int().min(0).default(0),
            query: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Pre Production Meetings.',
                });
            }

            const query = input.query?.trim();
            const where: Prisma.pre_production_meetingWhereInput = {
                order_styles: { buyer_orders: getOrderAccess(ctx.user) },
                ...(query ? {
                    OR: [
                        { factories: { name: { contains: query, mode: 'insensitive' } } },
                        { order_styles: { style: { contains: query, mode: 'insensitive' } } },
                        { order_styles: { buyer_orders: { ref_no: { contains: query, mode: 'insensitive' } } } },
                        { order_styles: { buyer_orders: { buyers: { buyer_name: { contains: query, mode: 'insensitive' } } } } },
                        { order_styles: { shipment_details: { some: { buyer_po: { contains: query, mode: 'insensitive' } } } } },
                    ],
                } : {}),
            };

            const [records, total] = await Promise.all([
                ctx.db.pre_production_meeting.findMany({
                    where,
                    select: {
                        id: true,
                        meeting_date: true,
                        daily_production_plan: true,
                        factories: { select: { name: true } },
                        order_styles: {
                            select: {
                                style: true,
                                order_quantity: true,
                                products: { select: { name: true } },
                                fabrics: { select: { name: true, description: true } },
                                buyer_orders: { select: { ref_no: true } },
                            },
                        },
                    },
                    orderBy: [{ added_at: 'desc' }, { id: 'desc' }],
                    take: input.limit,
                    skip: input.offset,
                }),
                ctx.db.pre_production_meeting.count({ where }),
            ]);

            const meetings = records.map((record) => {
                const style = record.order_styles;
                const fabric = style.fabrics;

                return {
                    id: record.id,
                    meeting_date: record.meeting_date,
                    factory_name: record.factories.name,
                    ref_no: style.buyer_orders.ref_no,
                    style: style.style,
                    item: style.products.name,
                    fabric: fabric.name,
                    order_quantity: style.order_quantity,
                    daily_production_plan: record.daily_production_plan,
                };
            });

            return { meetings, total };
        }),

    getPPMeetingById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_view) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view Pre Production Meetings.',
                });
            }

            try {
                const meeting = await ctx.db.pre_production_meeting.findFirstOrThrow({
                    where: { id: input.id, order_styles: { buyer_orders: getOrderAccess(ctx.user) } },
                    select: {
                        id: true,
                        meeting_date: true,
                        daily_production_plan: true,
                        overall_comments: true,
                        attendance_list_photo: true,
                        factories: { select: { name: true } },
                        order_styles: {
                            select: {
                                style: true,
                                order_quantity: true,
                                products: { 
                                    select: { 
                                        name: true 
                                    } 
                                },
                                fabrics: { 
                                    select: { 
                                        name: true, 
                                        description: true, 
                                        value: true, 
                                        unit: true 
                                    } 
                                },
                                buyer_orders: { 
                                    select: { 
                                        ref_no: true 
                                    } 
                                },
                                shipment_details: {
                                    select: {
                                        id: true,
                                        buyer_po: true,
                                        buyer_department_sizes: { 
                                            select: { 
                                                size: true 
                                            } 
                                        },
                                        factory_shipment_details: { 
                                            select: { 
                                                exfactory_date: true 
                                            } 
                                        },
                                        shipment_item_details: {
                                            select: { 
                                                color_id: true, 
                                                quantity: true, 
                                                colors: { 
                                                    select: { 
                                                        name: true 
                                                    } 
                                                } 
                                            },
                                        },
                                    },
                                    orderBy: [{ serial: 'asc' }, { id: 'asc' }],
                                },
                            },
                        },
                        production_plan: {
                            select: {
                                id: true,
                                color_id: true,
                                shipment_id: true,
                                cutting_date: true,
                                sewing_date: true,
                                finishing_date: true,
                                plan_inspection_date: true,
                                colors: { select: { name: true } },
                            },
                            orderBy: [{ shipment_details: { serial: 'asc' } }, { colors: { name: 'asc' } }, { id: 'asc' }],
                        },
                        approval_status: {
                            select: { id: true, status_name: true, approval_status: true },
                            orderBy: [{ added_at: 'asc' }, { id: 'asc' }],
                        },
                        pre_production_meeting_pps_images: {
                            select: { id: true, url: true },
                            orderBy: [{ added_at: 'asc' }, { id: 'asc' }],
                        },
                        pre_production_meeting_size_set_images: {
                            select: { id: true, url: true },
                            orderBy: [{ added_at: 'asc' }, { id: 'asc' }],
                        },
                    },
                });

                const style = meeting.order_styles;
                const fabric = style.fabrics;
                const shipments = style.shipment_details;
                const shipmentsById = new Map(shipments.map((shipment) => [shipment.id, shipment]));
                const shipmentDates = shipments.flatMap((shipment) => {
                    const date = shipment.factory_shipment_details?.exfactory_date;
                    return date ? [date] : [];
                });
                const firstShipmentDate = shipmentDates.sort((left, right) => left.getTime() - right.getTime())[0];

                return {
                    id: meeting.id,
                    meeting_date: meeting.meeting_date,
                    daily_production_plan: meeting.daily_production_plan,
                    factory_name: meeting.factories.name,
                    ref_no: style.buyer_orders.ref_no,
                    style: style.style,
                    first_shipment_date: firstShipmentDate ?? null,
                    item: style.products.name,
                    fabric_description: fabric.description ?? fabric.name ?? '',
                    required_gsm: fabric.value != null ? `${fabric.value} ${fabric.unit ?? ''}`.trim() : '',
                    order_quantity: style.order_quantity,
                    size_range: [...new Set(shipments.map((shipment) => shipment.buyer_department_sizes.size))].join(', '),
                    color_names: [...new Set(shipments.flatMap((shipment) => shipment.shipment_item_details.map((item) => item.colors.name)))].join(', '),
                    ppsImages: meeting.pre_production_meeting_pps_images,
                    sizeSetImages: meeting.pre_production_meeting_size_set_images,
                    overall_comments: meeting.overall_comments,
                    attendance_list_photo: meeting.attendance_list_photo,
                    productionPlans: meeting.production_plan.map((plan) => {
                        const shipment = shipmentsById.get(plan.shipment_id);
                        const quantity = shipment?.shipment_item_details
                            .filter((item) => item.color_id === plan.color_id)
                            .reduce((total, item) => total + item.quantity, 0);

                        return {
                            id: plan.id,
                            color_name: plan.colors.name,
                            po_no: shipment?.buyer_po ?? '',
                            size: shipment?.buyer_department_sizes.size ?? '',
                            order_quantity: quantity ?? 0,
                            cutting_date: plan.cutting_date,
                            sewing_date: plan.sewing_date,
                            finishing_date: plan.finishing_date,
                            plan_inspection_date: plan.plan_inspection_date,
                        };
                    }),
                    approvalStatus: meeting.approval_status.sort((left, right) => {
                        return checkList.findIndex((item) => item.status_name === left.status_name)
                            - checkList.findIndex((item) => item.status_name === right.status_name);
                    }),
                };
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updatePPMeeting: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
            meeting_date: z.string().date().or(z.literal('')),
            daily_production_plan: z.number().int().positive().max(2147483647),
            overall_comments: z.string().optional(),
            productionPlans: z.array(z.object({
                id: z.string().uuid(),
                cutting_date: z.string().date().or(z.literal('')),
                sewing_date: z.string().date().or(z.literal('')),
                finishing_date: z.string().date().or(z.literal('')),
                plan_inspection_date: z.string().date().or(z.literal('')),
            }).strict()),
            approvalStatus: z.array(z.object({
                id: z.string().uuid(),
                approval_status: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
            }).strict()),
        }).strict())
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_update) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to update Pre Production Meetings.',
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const meeting = await tx.pre_production_meeting.findFirstOrThrow({
                        where: { id: input.id, order_styles: { buyer_orders: getOrderAccess(ctx.user) } },
                        include: { production_plan: true, approval_status: true },
                    });

                    const planIds = new Set(input.productionPlans.map((plan) => plan.id));
                    const approvalIds = new Set(input.approvalStatus.map((approval) => approval.id));

                    if (planIds.size !== input.productionPlans.length 
                        || planIds.size !== meeting.production_plan.length
                        || meeting.production_plan.some((plan) => !planIds.has(plan.id))
                        || approvalIds.size !== input.approvalStatus.length || approvalIds.size !== meeting.approval_status.length
                        || meeting.approval_status.some((approval) => !approvalIds.has(approval.id))
                    ) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Production plans and approval statuses must belong to this PP meeting and appear once. Refresh the meeting and try again.',
                        });
                    }

                    await tx.pre_production_meeting.update({
                        where: { id: input.id },
                        data: {
                            meeting_date: input.meeting_date ? new Date(input.meeting_date) : null,
                            daily_production_plan: input.daily_production_plan,
                            overall_comments: input.overall_comments === undefined ? undefined : input.overall_comments || null,
                        },
                    });

                    await Promise.all(input.productionPlans.map((plan) => tx.production_plan.update({
                        where: { id: plan.id, pre_production_meeting_id: input.id },
                        data: {
                            cutting_date: plan.cutting_date ? new Date(plan.cutting_date) : null,
                            sewing_date: plan.sewing_date ? new Date(plan.sewing_date) : null,
                            finishing_date: plan.finishing_date ? new Date(plan.finishing_date) : null,
                            plan_inspection_date: plan.plan_inspection_date ? new Date(plan.plan_inspection_date) : null,
                        },
                    })));

                    await Promise.all(input.approvalStatus.map((approval) => tx.approval_status.update({
                        where: { id: approval.id, pre_production_meeting_id: input.id },
                        data: { approval_status: approval.approval_status },
                    })));

                    await tx.pre_production_meeting_history.create({
                        data: {
                            pre_production_meeting_id: meeting.id,
                            meeting_date: meeting.meeting_date,
                            factory_id: meeting.factory_id,
                            style_id: meeting.style_id,
                            daily_production_plan: meeting.daily_production_plan,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        },
                    });

                    if (meeting.production_plan.length) {
                        await tx.production_plan_history.createMany({
                            data: meeting.production_plan.map((plan) => ({
                                production_plan_id: plan.id,
                                pre_production_meeting_id: meeting.id,
                                color_id: plan.color_id,
                                shipment_id: plan.shipment_id,
                                cutting_date: plan.cutting_date,
                                sewing_date: plan.sewing_date,
                                finishing_date: plan.finishing_date,
                                plan_inspection_date: plan.plan_inspection_date,
                                action_by: ctx.user.id,
                                action_type: actions.UPDATE,
                            })),
                        });
                    }

                    if (meeting.approval_status.length) {
                        await tx.approval_status_history.createMany({
                            data: meeting.approval_status.map((approval) => ({
                                approval_status_id: approval.id,
                                pre_production_meeting_id: meeting.id,
                                status_name: approval.status_name,
                                approval_status: approval.approval_status,
                                action_by: ctx.user.id,
                                action_type: actions.UPDATE,
                            })),
                        });
                    }

                    return meeting.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getOrdersForPPMeeting: protectedProcedure
        .input(z.object({
            factoryId: z.number().int().positive()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_add) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to add Pre Production Meetings.' 
                });
            }

            return await ctx.db.buyer_orders.findMany({
                where: {
                    ...getOrderAccess(ctx.user),
                    factory_id: input.factoryId,
                    order_styles: {
                        some: {
                            pre_production_meeting: {
                                none: {}
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    ref_no: true
                },
                orderBy: { ref_no: 'asc' },
            })
        }),

    getStyleForPPMeeting: protectedProcedure
        .input(z.object({
            buyerId: z.number().int().positive()
        }))
        .query(async ({ctx, input}) => {
            if (!ctx.permissions[m.PP_MEETING]?.can_add) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to add Pre Production Meetings.' 
                });
            }

            return await ctx.db.order_styles.findMany({
                where: {
                    buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyerId },
                    pre_production_meeting: {
                        none: {}
                    }
                },
                select: {
                    id: true,
                    style: true,
                    order_id: true,
                    buyer_orders: { select: { ref_no: true, factory_id: true, factories: { select: { name: true } } } },
                    order_quantity: true,
                    products: { select: { name: true } },
                    fabrics: { select: { name: true, description: true, value: true, unit: true } },
                    shipment_details: {
                        where: { factory_shipment_details: { isNot: null } },
                        select: {
                            factory_shipment_details: { select: { exfactory_date: true } },
                        },
                        orderBy: { factory_shipment_details: { exfactory_date: 'asc' } },
                        take: 1,
                    },
                },
                orderBy: [{ style: 'asc' }, { buyer_orders: { ref_no: 'asc' } }, { serial: 'asc' }],
            })
        }),

    addPPMeeting: protectedProcedure
        .input(z.object({
            buyer_id: z.number().int().positive(),
            factory_id: z.number().int().positive(),
            style_id: z.string().uuid(),
            daily_plan_quantity: z.number().int().positive().max(2147483647)
        }))
        .mutation(async ({ctx, input}) => {
            const can_add = ctx.permissions[m.PP_MEETING]?.can_add;

            if (!can_add) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to add Pre Production Meeting.'
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    await tx.$queryRaw`SELECT id FROM order_styles WHERE id = ${input.style_id}::uuid FOR UPDATE`;
                    const style = await tx.order_styles.findFirst({
                        where: {
                            id: input.style_id,
                            buyer_orders: { ...getOrderAccess(ctx.user), buyer_id: input.buyer_id, factory_id: input.factory_id },
                            pre_production_meeting: { none: {} },
                        },
                        select: { id: true },
                    });

                    if (!style) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'This style is unavailable for a PP meeting for the selected buyer and factory. Refresh the style selection.',
                        });
                    }

                    const ppMeeting = await tx.pre_production_meeting.create({
                        data: {
                            factory_id: input.factory_id,
                            style_id: input.style_id,
                            daily_production_plan: input.daily_plan_quantity
                        }
                    });

                    await tx.pre_production_meeting_history.create({
                        data: {
                            pre_production_meeting_id: ppMeeting.id,
                            factory_id: input.factory_id,
                            style_id: input.style_id,
                            daily_production_plan: input.daily_plan_quantity,
                            action_by: ctx.user.id,
                            action_type: actions.ADDED
                        }
                    });

                    const items = await tx.shipment_item_details.findMany({
                        where: {
                            shipment_details: {
                                order_style_id: input.style_id,
                            },
                        },
                        select: {
                            color_id: true,
                            shipment_detail_id: true,
                        },
                    });

                    await tx.production_plan.createMany({
                        data: items.map((item) => ({
                            pre_production_meeting_id: ppMeeting.id,
                            color_id: item.color_id,
                            shipment_id: item.shipment_detail_id,
                        }))
                    });

                    await tx.approval_status.createMany({
                        data: getChecklist(ppMeeting.id)
                    })

                    return ppMeeting.id;

                })
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),    
})
