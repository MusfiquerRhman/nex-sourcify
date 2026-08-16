import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

interface EvPermission {
    id: number; 
    buyer_name: string; 
    user_name: string; 
    total_count: bigint
}

export const evPermissionRouter = createTRPCRouter({
    getEvPermissions: protectedProcedure
        .input(z.object({ factoryOrderID: z.string() }))
        .query(async ({ ctx, input }) => {
            const canView = ctx.permissions[m.FACTORY_ORDERS]?.can_view;

            if (!canView) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const hasPermission = await ctx.db.$queryRaw<{ ID: number | null }[]>`
                SELECT 
                    EVP.ID
                FROM ev_permissions AS EVP
                    INNER JOIN buyer_orders AS BO ON BO.buyer_id = EVP.buyer_id
                    INNER JOIN FACTORY_ORDERS AS FO ON FO.order_id = BO.id
                WHERE FO.ID = ${input.factoryOrderID} AND EVP.user_id = ${ctx.user.id};
            `;

            return hasPermission.length > 0 ? true : false; // Return true if user has permission, false otherwise
        }),

    getAllEvPermissions: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),  
        }))
        .query(async ({ ctx, input }) => {
            const canView = ctx.permissions[m.EV_PERMISSIONS]?.can_view;

            if (!canView) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const rows = await ctx.db.$queryRaw<EvPermission[]>`
                SELECT 
                    EVP.ID AS id,
                    B.BUYER_NAME AS buyer_name,
                    CONCAT(U.FIRST_NAME, ' ', U.last_name) AS user_name,
                    COUNT(*) OVER() AS total_count
                FROM EV_PERMISSIONS AS EVP
                    INNER JOIN BUYERS AS B ON B.ID = EVP.BUYER_ID
                    INNER JOIN USERS AS U ON U.ID = EVP.USER_ID
                ORDER BY EVP.added_at DESC
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

            const evPermissions = rows.map(({ total_count: _, ...rest }) => rest);

            return { evPermissions, total: totalCount };
        }),

    searchEvPermissions: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),  
        }))
        .query(async ({ ctx, input }) => {
            const canView = ctx.permissions[m.EV_PERMISSIONS]?.can_view;

            if (!canView) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const rows = await ctx.db.$queryRaw<EvPermission[]>`
                SELECT
                    EVP.ID AS id,
                    B.BUYER_NAME AS buyer_name,
                    CONCAT(U.FIRST_NAME, ' ', U.last_name) AS user_name,
                    COUNT(*) OVER() AS total_count
                FROM EV_PERMISSIONS AS EVP
                    INNER JOIN BUYERS AS B ON B.ID = EVP.BUYER_ID
                    INNER JOIN USERS AS U ON U.ID = EVP.USER_ID
                WHERE B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                    OR CONCAT(U.FIRST_NAME, ' ', U.last_name) ILIKE '%' || ${input.query} || '%'
                    OR U.user_id ILIKE '%' || ${input.query} || '%'
                ORDER BY EVP.added_at DESC
                LIMIT ${input.limit}
                OFFSET ${input.offset};
            `;

            const totalCount = rows.length > 0 && rows[0] ? Number(rows[0].total_count) : 0;

            const evPermissions = rows.map(({ total_count: _, ...rest }) => rest);

            return { evPermissions, total: totalCount };
        }),

    deleteEvPermission: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const canDelete = ctx.permissions[m.EV_PERMISSIONS]?.can_delete;

            if (!canDelete) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete this resource.",
                });
            }

            try {
                const deletedPermission = await ctx.db.ev_permissions.delete({
                    where: { id: input.id },
                });

                await ctx.db.ev_permission_history.create({
                    data: {
                        ev_permission_id: deletedPermission.id,
                        action_type: 'DELETE',
                        action_by: ctx.user.id,
                        user_id: deletedPermission.user_id,
                        buyer_id: deletedPermission.buyer_id,
                    },
                });

                return deletedPermission;
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateEvPermission: protectedProcedure
        .input(z.object({
            id: z.number(),
            user_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const canUpdate = ctx.permissions[m.EV_PERMISSIONS]?.can_update;

                if (!canUpdate) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to update this resource.",
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const updatedPermission = await ctx.db.ev_permissions.update({
                        where: { id: input.id },
                        data: {
                            user_id: input.user_id,
                        },
                    });

                    await ctx.db.ev_permission_history.create({
                        data: {
                            ev_permission_id: updatedPermission.id,
                            action_type: 'UPDATE',
                            action_by: ctx.user.id,
                            user_id: updatedPermission.user_id,
                            buyer_id: updatedPermission.buyer_id,
                        },
                    });
                    return updatedPermission;
                })

            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
    }),

    addEvPermission: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            user_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const canAdd = ctx.permissions[m.EV_PERMISSIONS]?.can_add;
                if (!canAdd) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to add this resource.",
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const newPermission = await ctx.db.ev_permissions.create({
                        data: {
                            buyer_id: input.buyer_id,
                            user_id: input.user_id,
                        },
                    });

                    await ctx.db.ev_permission_history.create({
                        data: {
                            ev_permission_id: newPermission.id,
                            action_type: 'ADDED',
                            action_by: ctx.user.id,
                            user_id: newPermission.user_id,
                            buyer_id: newPermission.buyer_id,
                        },
                    });
                    
                    return newPermission;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getEvPermissionById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const canView = ctx.permissions[m.EV_PERMISSIONS]?.can_view;

            if (!canView) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this resource.",
                });
            }

            const permission = await ctx.db.ev_permissions.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    buyer_id: true,
                    user_id: true,
                },
            });

            return permission;
        }),
});
    