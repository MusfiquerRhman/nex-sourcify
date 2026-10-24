import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notificationFilters, notificationFormSchema } from "~/app/(authed)/maintenance/notifications/config/formSchema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { NotificationAuditItem, NotificationModuleOption } from "~/types/notification";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { m } from "~/utils/moduleMap";
import { Prisma } from "@prisma/client";

const notificationPageSize = 50;

const notificationModuleIds = [
    m.FACTORY_ORDERS, 
    m.SALES_CONTRACTS, 
    m.COMMISSION_DISTRIBUTION, 
    m.LC_MASTER, 
    m.EX_FACTORIES, 
    m.RDL_INVOICE, 
    m.CROSS_PAYMENT
];

const notificationAuditProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.permissions[m.NOTIFICATIONS]?.can_view) {
        throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "You do not have permission to view system notifications." 
        });
    }

    return next();
});

export const notificationsRouter = createTRPCRouter({
    getFilterOptions: notificationAuditProcedure.query(async ({ ctx }) => {
        const [modules, recipients, levels, departments] = await Promise.all([
            ctx.db.modules.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
            ctx.db.users.findMany({
                select: { id: true, first_name: true, last_name: true, user_id: true },
                orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { id: "asc" }],
            }),
            ctx.db.levels.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
            ctx.db.departments.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        ]);

        return { modules, recipients, levels, departments };
    }),

    getAll: notificationAuditProcedure
        .input(z.object({
            filters: notificationFilters,
            page: z.number().int().min(1).default(1),
        }))
        .query(async ({ ctx, input }) => {
            const { filters } = input;
            const conditions: Prisma.Sql[] = [];

            if (filters.module_id) conditions.push(Prisma.sql`N.module_id = ${filters.module_id}`);
            if (filters.from_date) conditions.push(Prisma.sql`N.added_at >= ${filters.from_date}::date`);
            if (filters.to_date) conditions.push(Prisma.sql`N.added_at < (${filters.to_date}::date + INTERVAL '1 day')`);
            if (filters.recipients_ids?.length) {
                conditions.push(Prisma.sql`N.recipient_id IN (${Prisma.join(filters.recipients_ids.map((id) => Prisma.sql`${id}::uuid`))})`);
            }
            if (filters.level_id) conditions.push(Prisma.sql`U.level_id = ${filters.level_id}`);
            if (filters.department_id) conditions.push(Prisma.sql`U.department_id = ${filters.department_id}`);

            const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
            const [count] = await ctx.db.$queryRaw<{ total: bigint }[]>`
                SELECT COUNT(*) AS total
                FROM notifications AS N
                    INNER JOIN users AS U ON U.id = N.recipient_id
                ${whereClause}
            `;

            const total = Number(count?.total ?? 0);
            const totalPages = Math.max(1, Math.ceil(total / notificationPageSize));
            const page = Math.min(input.page, totalPages);
            const items = await ctx.db.$queryRaw<NotificationAuditItem[]>`
                SELECT
                    N.id,
                    N.title,
                    N.body,
                    U.first_name,
                    U.last_name,
                    N.slug,
                    N.event_type,
                    N.is_marked,
                    N.marked_at,
                    N.added_at
                FROM notifications AS N
                    INNER JOIN users AS U ON U.id = N.recipient_id
                ${whereClause}
                ORDER BY N.added_at DESC NULLS LAST, N.id DESC
                LIMIT ${notificationPageSize}
                OFFSET ${(page - 1) * notificationPageSize}
            `;

            return { items, page, pageSize: notificationPageSize, total, totalPages };
        }),

    list: protectedProcedure
        .input(
            z.object({
                page: z.number().int().min(1).default(1),
                filter: z.enum(["all", "unread", "system"]).default("all"),
                moduleId: z.number().int().positive().nullable().default(null),
                dismissedIds: z.array(z.string().uuid()).default([]),
            }),
        )
        .query(async ({ ctx, input }) => {
            const isAdmin = ctx.user.level_id === ADMIN_LEVEL_ID && ctx.user.department_id === ADMIN_DEPARTMENT_ID;
            let modules: NotificationModuleOption[];

            if (isAdmin) {
                modules = await ctx.db.modules.findMany({
                    where: { id: { in: notificationModuleIds } },
                    select: { id: true, name: true },
                    orderBy: { id: "asc" },
                });
            } else {
                modules = await ctx.db.$queryRaw<NotificationModuleOption[]>`
                    SELECT DISTINCT
                        M.id, M.name
                    FROM USERS AS U
                        INNER JOIN level_permission AS LP ON LP.department_id = U.department_id AND LP.level_id = U.level_id
                        INNER JOIN modules AS M ON M.id = LP.module_id
                    WHERE U.id = ${ctx.user.id}::uuid
                        AND M.id IN (${Prisma.join(notificationModuleIds)})
                        AND LP.can_view = true
                    ORDER BY M.ID ASC;
                `;
            }

            if (input.moduleId !== null && !modules.some((module) => module.id === input.moduleId)) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this notification module filter." });
            }

            const recipientWhere = { recipient_id: ctx.user.id };

            const baseWhere: Prisma.notificationsWhereInput = {
                ...recipientWhere,
                ...(input.dismissedIds.length > 0 ? { id: { notIn: input.dismissedIds } } : {}),
            };

            const moduleWhere: Prisma.notificationsWhereInput = {
                ...baseWhere,
                ...(input.moduleId !== null ? { module_id: input.moduleId } : {}),
            };

            const systemWhere = { ...baseWhere, module_id: null };
            
            const [allCount, pendingCount, systemCount, globalUnreadCount] = await Promise.all([
                ctx.db.notifications.count({ where: moduleWhere }),
                ctx.db.notifications.count({ where: { ...moduleWhere, marked_at: null } }),
                ctx.db.notifications.count({ where: systemWhere }),
                input.moduleId === null && input.dismissedIds.length === 0
                    ? Promise.resolve(null)
                    : ctx.db.notifications.count({ where: { ...recipientWhere, marked_at: null } }),
            ]);

            const counts = { all: allCount, unread: pendingCount, system: systemCount };
            const total = counts[input.filter];
            const totalPages = Math.max(1, Math.ceil(total / notificationPageSize));
            const page = Math.min(input.page, totalPages);
            const where: Prisma.notificationsWhereInput = input.filter === "system" ? systemWhere : { ...moduleWhere };
            if (input.filter === "unread") where.marked_at = null;

            const items = await ctx.db.notifications.findMany({
                where,
                orderBy: [{ added_at: "desc" }, { id: "desc" }],
                skip: (page - 1) * notificationPageSize,
                take: notificationPageSize,
            });

            return { items, counts, unreadCount: globalUnreadCount ?? pendingCount, modules, page, pageSize: notificationPageSize, total, totalPages };
        }),

    markRead: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) =>
        ctx.db.notifications.updateMany({
            where: { id: input.id, recipient_id: ctx.user.id, marked_at: null },
            data: { marked_at: new Date(), is_marked: true },
        }),
    ),

    markAllRead: protectedProcedure.mutation(({ ctx }) =>
        ctx.db.notifications.updateMany({
            where: { recipient_id: ctx.user.id, marked_at: null },
            data: { marked_at: new Date(), is_marked: true },
        }),
    ),

    addNotification: protectedProcedure
        .input(notificationFormSchema)
        .mutation(async ({ ctx, input }) => {
            const isAdmin = ctx.user.level_id === ADMIN_LEVEL_ID && ctx.user.department_id === ADMIN_DEPARTMENT_ID;

            if (!isAdmin) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to add system notifications.",
                });
            }

            const recipients = await ctx.db.users.findMany({
                where: {
                    ...(input.level_id ? { level_id: input.level_id } : {}),
                    ...(input.department_id ? { department_id: input.department_id } : {}),
                    is_active: true
                },
                select: { id: true },
            });

            if (recipients.length === 0) {
                throw new TRPCError({ 
                    code: "BAD_REQUEST", 
                    message: "No users match the selected level and department." 
                });
            }

            return ctx.db.notifications.createMany({
                data: recipients.map((recipient) => ({
                    title: input.title,
                    body: input.description,
                    event_type: input.event_type,
                    recipient_id: recipient.id,
                })),
            });
        }),
});
