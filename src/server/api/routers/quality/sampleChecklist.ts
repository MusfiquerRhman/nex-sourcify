import { actions, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { getPPMeetingOrderAccess as getOrderAccess } from "~/server/_utils/ppMeetingAccess";
import { sampleChecklistImagesInclude } from "~/server/_utils/sampleChecklist";
import { getSampleChecklistAccess, getSampleChecklistBuyerAccess } from "~/server/_utils/sampleChecklistAccess";
import { deleteSampleChecklist } from "~/server/_utils/deleteSampleChecklist";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { m } from "~/utils/moduleMap";
import { sampleChecklistFormSchema, type SampleChecklistFormValues } from "~/app/(authed)/quality/sample_checklist/config/formSchema";
import { transactionWithQueuedHistory } from "~/server/queues/transactionWithQueuedHistory";

const checklistProcedure = protectedProcedure.use(({ ctx, next }) => {
    const permissions = ctx.permissions[m.SAMPLE_CHECKLIST];
    if (!permissions?.can_view && !permissions?.can_add && !permissions?.can_update) {
        throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "You do not have permission to access Sample Checklists." 
        });
    }

    return next({ ctx });
});

async function getChecklistWriteData(
    tx: Prisma.TransactionClient,
    user: Parameters<typeof getSampleChecklistAccess>[0],
    input: SampleChecklistFormValues,
) {
    const { order_id, sample_check_date, ...values } = input;

    const [buyer, factory, sampleType, color] = await Promise.all([
        tx.buyers.findFirst({
            where: {
                ...getSampleChecklistBuyerAccess(user),
                id: input.buyer_id
            },
            select: {
                id: true,
                prefix: true,
                short_name: true
            }
        }),
        tx.factories.findUnique({
            where: {
                id: input.factory_id
            },
            select: {
                id: true,
                prefix: true
            }
        }),
        tx.sample_types.findUnique({
            where: {
                id: input.sample_type
            },
            select: {
                id: true
            }
        }),
        tx.colors.findUnique({
            where: {
                id: input.color_id
            },
            select: {
                id: true
            }
        }),
    ]);

    if (!buyer || !factory || !sampleType || !color) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select an available buyer, factory, sample type, and color."
        });
    }

    if (input.with_order) {
        const style = await tx.order_styles.findFirst({
            where: {
                id: input.style_id,
                order_id,
                buyer_orders: {
                    ...getOrderAccess(user),
                    buyer_id: input.buyer_id,
                    factory_id: input.factory_id
                },
            },
            select: { id: true },
        });

        if (!style) throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select a style belonging to the selected buyer, factory, and order."
        });

        const styleColor = await tx.shipment_item_details.findFirst({
            where: {
                color_id: input.color_id,
                shipment_details: { order_style_id: style.id }
            },
            select: { id: true },
        });

        if (!styleColor) throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select a color available in the selected style."
        });

        if (input.sample_size) {
            const size = await tx.shipment_details.findFirst({
                where: {
                    order_style_id: style.id,
                    buyer_department_sizes: { size: input.sample_size }
                },
                select: { id: true },
            });

            if (!size) throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Select a size available in the selected style."
            });
        }
    } else if (input.sample_size) {
        const size = await tx.buyer_department_sizes.findFirst({
            where: {
                size: input.sample_size,
                buyer_departments: {
                    buyer_brands: { buyer_id: input.buyer_id }
                }
            },
            select: { id: true },
        });

        if (!size) throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select a size belonging to the selected buyer."
        });
    }

    const data = {
        ...values,
        checked_by: user.id,
        style_id: input.with_order ? input.style_id : null,
        style_no_manual: input.with_order ? null : input.style_no_manual,
        sample_check_date: new Date(`${sample_check_date}T00:00:00.000Z`),
    };

    return { buyer, factory, data };
}

export const sampleChecklistRouter = createTRPCRouter({
    getSampleChecklists: checklistProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).default(15),
                offset: z.number().int().min(0).default(0),
                query: z.string().optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Sample Checklists." 
                });
            }

            const query = input.query?.trim();
            const where: Prisma.sample_check_listWhereInput = {
                ...getSampleChecklistAccess(ctx.user),
                ...(query
                    ? {
                          OR: [
                                { sample_ref_no: { contains: query, mode: "insensitive" } },
                                { style_no_manual: { contains: query, mode: "insensitive" } },
                                { 
                                    buyers: { 
                                        buyer_name: { 
                                            contains: query, mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    factories: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    order_styles: { 
                                        style: {
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    order_styles: { 
                                        buyer_orders: { 
                                            ref_no: { 
                                                contains: query, 
                                                mode: "insensitive" 
                                            } 
                                        } 
                                    } 
                                },
                                { 
                                    colors: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                                { 
                                    sample_types: { 
                                        name: { 
                                            contains: query, 
                                            mode: "insensitive" 
                                        } 
                                    } 
                                },
                          ],
                      }
                    : {}),
            };

            const [records, total] = await Promise.all([
                ctx.db.sample_check_list.findMany({
                    where,
                    select: {
                        id: true,
                        sample_ref_no: true,
                        submission_no: true,
                        with_order: true,
                        style_id: true,
                        style_no_manual: true,
                        sample_check_date: true,
                        sample_size: true,
                        sample_quantity: true,
                        status: true,
                        buyers: { 
                            select: { 
                                buyer_name: true 
                            } 
                        },
                        factories: { 
                            select: { 
                                name: true 
                            } 
                        },
                        colors: { 
                            select: { 
                                name: true 
                            } 
                        },
                        sample_types: { 
                            select: { 
                                name: true 
                            } 
                        },
                        order_styles: { 
                            select: { 
                                style: true, 
                                buyer_orders: { 
                                    select: { 
                                        ref_no: true 
                                    } 
                                } 
                            } 
                        },
                    },
                    orderBy: [
                        { added_at: "desc" }, 
                        { id: "desc" }
                    ],
                    take: input.limit,
                    skip: input.offset,
                }),

                ctx.db.sample_check_list.count({ where }),
            ]);

            return {
                checklists: records.map((record) => {
                    const withOrder = record.with_order ?? !!record.style_id;
                    return {
                        id: record.id,
                        sample_ref_no: record.sample_ref_no,
                        submission_no: record.submission_no ?? 1,
                        with_order: withOrder,
                        sample_check_date: record.sample_check_date,
                        buyer_name: record.buyers.buyer_name,
                        factory_name: record.factories.name,
                        ref_no: withOrder ? (record.order_styles?.buyer_orders.ref_no ?? "-") : "-",
                        style: withOrder ? (record.order_styles?.style ?? "-") : (record.style_no_manual ?? "-"),
                        color: record.colors.name,
                        sample_type: record.sample_types.name,
                        sample_size: record.sample_size,
                        sample_quantity: record.sample_quantity,
                        status: record.status,
                    };
                }),
                total,
            };
        }),

    getResubmissionReferences: checklistProcedure.query(async ({ ctx }) => {
        const permissions = ctx.permissions[m.SAMPLE_CHECKLIST];
        if (!permissions?.can_add || !permissions.can_view) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You need permission to view and add Sample Checklists." });
        }

        return ctx.db.sample_check_list.findMany({
            where: { ...getSampleChecklistAccess(ctx.user), sample_ref_no: { not: "" } },
            select: {
                id: true,
                sample_ref_no: true,
                with_order: true,
                sample_check_date: true,
                buyer_id: true,
                factory_id: true,
                style_id: true,
                style_no_manual: true,
                color_id: true,
                sample_type: true,
                status: true,
                sample_size: true,
                sample_quantity: true,
                order_styles: { select: { order_id: true } },
            },
            orderBy: [{ added_at: "desc" }, { id: "desc" }],
        });
    }),

    getSampleChecklistById: checklistProcedure
        .input(z.object({ 
            id: z.string().uuid() 
        }))
        .query(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view Sample Checklists." 
                });
            }

            const checklist = await ctx.db.sample_check_list.findFirst({
                where: { 
                    ...getSampleChecklistAccess(ctx.user),
                    id: input.id, 
                },
                include: {
                    ...sampleChecklistImagesInclude,
                    users: { select: { user_id: true } },
                    buyers: { 
                        select: { 
                            buyer_name: true 
                        } 
                    },
                    factories: { 
                        select: { 
                            name: true 
                        } 
                    },
                    colors: { 
                        select: { 
                            name: true 
                        } 
                    },
                    sample_types: { 
                        select: { 
                            name: true 
                        } 
                    },
                    order_styles: { 
                        select: { 
                            order_id: true, 
                            style: true,
                            buyer_orders: { 
                                select: { 
                                    ref_no: true
                                } 
                            } 
                        } 
                    },
                },
            });

            if (!checklist) throw new TRPCError({ 
                code: "NOT_FOUND", 
                message: "Sample Checklist not found." 
            });

            const withOrder = checklist.with_order ?? !!checklist.style_id;

            return { 
                ...checklist, 
                with_order: withOrder, 
                order_id: withOrder ? (checklist.order_styles?.order_id ?? "") : "" 
            };
        }),

    getOrders: checklistProcedure
        .input(z.object({ 
            buyerId: z.number().int().positive(), 
            factoryId: z.number().int().positive() 
        }))
        .query(async ({ ctx, input }) => {
            return ctx.db.buyer_orders.findMany({
                where: { 
                    ...getOrderAccess(ctx.user), 
                    buyer_id: input.buyerId, 
                    factory_id: input.factoryId 
                },
                select: { 
                    id: true, 
                    ref_no: true 
                },
                orderBy: { 
                    ref_no: "asc" 
                },
            });
        }),

    getStyles: checklistProcedure
        .input(z.object({ 
            buyerId: z.number().int().positive(), 
            factoryId: z.number().int().positive(),
            availableOnly: z.boolean().default(false),
        }))
        .query(async ({ ctx, input }) => {
            const sampleTypes = input.availableOnly ? await ctx.db.sample_types.findMany({ select: { id: true } }) : undefined;

            return ctx.db.order_styles.findMany({
                where: {
                    buyer_orders: { 
                        ...getOrderAccess(ctx.user), 
                        buyer_id: input.buyerId, 
                        factory_id: input.factoryId 
                    },
                    ...(sampleTypes && {
                        OR: sampleTypes.map(({ id }) => ({ sample_check_list: { none: { sample_type: id } } })),
                    }),
                },
                select: { 
                    id: true, 
                    style: true,
                    order_id: true,
                    buyer_orders: { select: { ref_no: true } },
                },
                orderBy: [
                    { style: "asc" },
                    { buyer_orders: { ref_no: "asc" } },
                    { serial: "asc" }
                ],
            });
        }),

    getStyleOptions: checklistProcedure
        .input(z.object({ 
            styleId: z.string().uuid(),
            availableOnly: z.boolean().default(false),
        }))
        .query(async ({ ctx, input }) => {
            const style = await ctx.db.order_styles.findFirst({
                where: { id: input.styleId, buyer_orders: getOrderAccess(ctx.user) },
                select: { id: true },
            });

            if (!style) throw new TRPCError({ 
                code: "NOT_FOUND", 
                message: "Style not found." 
            });

            const access = { 
                order_style_id: input.styleId,
                order_styles: { 
                    buyer_orders: getOrderAccess(ctx.user) 
                } 
            };

            const [colorGroups, shipments, sampleTypes] = await Promise.all([
                ctx.db.shipment_item_details.groupBy({
                    by: ["color_id"],
                    where: { 
                        shipment_details: access 
                    },
                }),
                ctx.db.shipment_details.findMany({
                    where: access,
                    select: { 
                        buyer_department_sizes: { 
                            select: { 
                                size: true 
                            } 
                        } 
                    },
                    orderBy: [
                        { serial: "asc" }, 
                        { id: "asc" }
                    ],
                }),
                ctx.db.sample_types.findMany({
                    where: input.availableOnly ? { sample_check_list: { none: { style_id: style.id } } } : undefined,
                    select: { id: true, name: true },
                    orderBy: { name: "asc" },
                }),
            ]);

            const colors = await ctx.db.colors.findMany({
                where: { 
                    id: { 
                        in: colorGroups.map((group) => group.color_id) 
                    } 
                },
                select: { 
                    id: true, 
                    name: true 
                },
                orderBy: { 
                    name: "asc" 
                },
            });

            return { 
                colors, 
                sizes: [...new Set(shipments.map((shipment) => shipment.buyer_department_sizes.size))], 
                sampleTypes 
            };
        }),

    getManualOptions: checklistProcedure
        .input(z.object({ buyerId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const buyer = await ctx.db.buyers.findFirst({
                where: { ...getSampleChecklistBuyerAccess(ctx.user), id: input.buyerId },
                select: { id: true },
            });

            if (!buyer) throw new TRPCError({ 
                code: "NOT_FOUND", 
                message: "Buyer not found." 
            });

            const [colors, sizes] = await Promise.all([
                ctx.db.colors.findMany({ 
                    select: { 
                        id: true, 
                        name: true 
                    }, 
                    orderBy: { name: "asc" } 
                }),
                ctx.db.buyer_department_sizes.findMany({
                    where: { 
                        buyer_departments: { 
                            buyer_brands: { 
                                buyer_id: input.buyerId 
                            } 
                        } 
                    },
                    distinct: ["size"],
                    select: { size: true },
                    orderBy: { size: "asc" },
                }),
            ]);

            return { colors, sizes: sizes.map((size) => size.size) };
        }),

    deleteSampleChecklist: protectedProcedure
        .input(z.object({ 
            id: z.string().uuid() 
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete Sample Checklists." 
                });
            }

            try {
                return await deleteSampleChecklist(ctx.db, { 
                    id: input.id, 
                    checklistAccess: getSampleChecklistAccess(ctx.user),
                    actionBy: ctx.user.id 
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    addSampleCheckList: checklistProcedure
        .input(sampleChecklistFormSchema.and(z.discriminatedUnion("is_resubmission", [
            z.object({ is_resubmission: z.literal(false), previous_submission_id: z.never().optional() }),
            z.object({ is_resubmission: z.literal(true), previous_submission_id: z.string().uuid() }),
        ])))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_add) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add Sample Checklists.",
                });
            }

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    const { is_resubmission, previous_submission_id, ...values } = input;
                    if (is_resubmission && !ctx.permissions[m.SAMPLE_CHECKLIST]?.can_view) {
                        throw new TRPCError({ code: "FORBIDDEN", message: "You need permission to view Sample Checklists to resubmit one." });
                    }

                    const { buyer, factory, data } = await getChecklistWriteData(tx, ctx.user, values);

                    // Serialize reference and submission number allocation, including creation of the first counter for a year.
                    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(1297302347, 1)`;

                    const previous = previous_submission_id ? await tx.sample_check_list.findFirst({
                        where: { ...getSampleChecklistAccess(ctx.user), id: previous_submission_id },
                        select: { id: true, submission_no: true },
                    }) : null;

                    if (is_resubmission && !previous) {
                        throw new TRPCError({ code: "NOT_FOUND", message: "The previous Sample Checklist was not found." });
                    }

                    const latest = await tx.sample_check_list.aggregate({
                        where: {
                            sample_type: data.sample_type,
                            ...(data.style_id ? { style_id: data.style_id } : { style_no_manual: data.style_no_manual }),
                        },
                        _max: { submission_no: true },
                        _count: true,
                    });

                    if (!previous && latest._count > 0) {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: "A checklist already exists for this style and sample type. Select Resubmission and choose its reference.",
                        });
                    }

                    const previousCounter = previous ? await tx.sample_checklist_submission_no_meta_data.aggregate({
                        where: { sample_checklist_id: previous.id },
                        _max: { sample_no: true },
                    }) : null;
                    const submissionNo = previous ? Math.max(previous.submission_no ?? 1, previousCounter?._max.sample_no ?? 1, latest._max.submission_no ?? 0) + 1 : 1;
                    const currentYear = new Date().getFullYear();

                    const existingRefNoMetaData = await tx.sample_checklist_ref_no_metadata.findFirst({
                        where: { year: currentYear },
                        orderBy: [{ last_serial: { sort: "desc", nulls: "last" } }, { id: "desc" }],
                        select: { id: true, last_serial: true },
                    });

                    const meta = existingRefNoMetaData
                        ? await tx.sample_checklist_ref_no_metadata.update({
                            where: { id: existingRefNoMetaData.id },
                            data: { last_serial: (existingRefNoMetaData.last_serial ?? 0) + 1 },
                        })
                        : await tx.sample_checklist_ref_no_metadata.create({
                            data: { year: currentYear, last_serial: 1 },
                        });

                    const newRefNo = `SAMPLE/${buyer.prefix || buyer.short_name}/${factory.prefix}/${currentYear}/${String(meta.last_serial).padStart(4, "0")}`;

                    const checklistData: Prisma.sample_check_listUncheckedCreateInput = {
                        ...data,
                        sample_ref_no: newRefNo,
                        submission_no: submissionNo,
                        is_resubmission,
                        previous_submission_id: previous?.id ?? null,
                    };
                    
                    const checklist = await tx.sample_check_list.create({
                        data: checklistData,
                    });

                    await tx.sample_checklist_submission_no_meta_data.create({
                        data: { sample_checklist_id: checklist.id, sample_no: submissionNo },
                    });

                    if (previous) {
                        const { count } = await tx.sample_checklist_submission_no_meta_data.updateMany({
                            where: { sample_checklist_id: previous.id },
                            data: { sample_no: submissionNo },
                        });

                        if (!count) {
                            await tx.sample_checklist_submission_no_meta_data.create({
                                data: { sample_checklist_id: previous.id, sample_no: submissionNo },
                            });
                        }
                    }

                    await tx.sample_check_list_history.create({
                        data: { ...checklistData, action_by: ctx.user.id, action_type: actions.ADDED },
                    });

                    return checklist.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateSampleChecklist: checklistProcedure
        .input(sampleChecklistFormSchema.and(z.object({ id: z.string().uuid() })))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.permissions[m.SAMPLE_CHECKLIST]?.can_update) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to update Sample Checklists.",
                });
            }

            const { id, ...values } = input;

            try {
                return await transactionWithQueuedHistory(ctx.db, async (tx) => {
                    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(1297302347, 1)`;

                    const existing = await tx.sample_check_list.findFirst({
                        where: { ...getSampleChecklistAccess(ctx.user), id },
                        include: { order_styles: { select: { order_id: true } } },
                    });

                    if (!existing) throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Sample Checklist not found.",
                    });

                    const orderModeChanged = values.with_order !== (existing.with_order ?? !!existing.style_id);
                    const { data: validatedData } = await getChecklistWriteData(tx, ctx.user, {
                        ...values,
                        buyer_id: existing.buyer_id,
                        factory_id: existing.factory_id,
                        color_id: existing.color_id,
                        sample_type: existing.sample_type,
                        sample_size: existing.sample_size ?? "",
                        order_id: orderModeChanged ? values.order_id : existing.order_styles?.order_id ?? "",
                        style_id: orderModeChanged ? values.style_id : existing.style_id ?? "",
                        style_no_manual: orderModeChanged ? values.style_no_manual : existing.style_no_manual ?? "",
                    });
                    const data = {
                        ...validatedData,
                        sample_check_date: existing.sample_check_date,
                        sample_size: existing.sample_size,
                        with_order: orderModeChanged ? validatedData.with_order : existing.with_order,
                        style_id: orderModeChanged ? validatedData.style_id : existing.style_id,
                        style_no_manual: orderModeChanged ? validatedData.style_no_manual : existing.style_no_manual,
                    };
                    const checklist = await tx.sample_check_list.update({ where: { id }, data });

                    await tx.sample_check_list_history.create({
                        data: {
                            ...data,
                            sample_ref_no: checklist.sample_ref_no,
                            submission_no: checklist.submission_no,
                            is_resubmission: checklist.is_resubmission,
                            previous_submission_id: checklist.previous_submission_id,
                            action_by: ctx.user.id,
                            action_type: actions.UPDATE,
                        },
                    });

                    return checklist.id;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),
});
