import { createTRPCRouter, invalidateAuthPermissionsCache, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { m } from "~/utils/moduleMap";
import { TRPCError } from "@trpc/server";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { db } from "~/server/db";
// import { DEVELOPER_ID, ERROR_LOGS } from "~/utils/config";

import { getRedis } from "~/server/redis";

const getPermissionsCacheKey = (levelId: number, departmentId: number | null) =>
	`permissions:${levelId}:${departmentId}`;

const getPermissions = async (database: typeof db, levelId: number, departmentId: number) => {
	const permissionsObject = await database.level_permission.findMany({
		where: {
			level_id: levelId,
			department_id: departmentId,
		},
		select: {
			id: true,
			modules: {
				select: {
					id: true,
					name: true,
					modules: {
						select: {
							name: true,
							modules: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			},
			can_view: true,
			can_add: true,
			can_update: true,
			can_delete: true,
			can_trace: true,
		},
		orderBy: {
			modules: {
				parent_module_id: "asc",
			},
		},
	});

	return permissionsObject.map((permission) => {
		const modules = permission.modules;
		const parent = modules?.modules;
		const grandparent = parent?.modules;

		return {
			...permission,
			module_name: modules?.name ?? null,
			module_id: modules?.id ?? null,
			parent_module_name: grandparent?.name ?? parent?.name ?? null,
		};
	});
};

type CachedPermissions = Awaited<ReturnType<typeof getPermissions>>;

export const permissionRouter = createTRPCRouter({
	getPermissions: protectedProcedure.input(
		z.object({
			level_id: z.string(),
			department_id: z.string(),
		})
	)
  	.query(async ({ ctx, input }) => {
		const redis = await getRedis();
		const cacheKey = getPermissionsCacheKey(
			parseInt(input.level_id),
			parseInt(input.department_id),
		);
		const cached = redis ? await redis.get(cacheKey) : null;

		if (cached) {
			return JSON.parse(cached) as CachedPermissions;
		}

		const permissions = await getPermissions(
			ctx.db,
			parseInt(input.level_id),
			parseInt(input.department_id),
		);

	if (redis) await redis.set(cacheKey, JSON.stringify(permissions), { EX: 600 }); // Cache for 10 minutes

    return permissions;
  }),


	updatePermissions: protectedProcedure.input(
		z.object({
			permissions: z.record(
				z.object({
					can_view: z.boolean().optional(),
					can_add: z.boolean().optional(),
					can_update: z.boolean().optional(),
					can_delete: z.boolean().optional(),
				})
			),
		})
    )
    .mutation(async ({ctx, input}) => {
        const can_update = ctx.permissions[m.PERMISSIONS]?.can_update ?? false;

        if (!can_update) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to update these permissions." 
			});
        }

        try {
			const affectedPermissions = await ctx.db.level_permission.findMany({
				where: { id: { in: Object.keys(input.permissions) } },
				select: { level_id: true, department_id: true },
			});

			await Promise.all(
				Object.entries(input.permissions).map(async ([id, permission]) => {

				if (permission.can_view !== true) {
					return await ctx.db.level_permission.deleteMany({
						where: { id: id }
					});
				}

				return await ctx.db.level_permission.update({
					where: { id: id },
					data: {
						can_view: true,
						can_add: permission.can_add,
						can_update: permission.can_update,
						can_delete: permission.can_delete,
						}
					});
				})
			);

			const redis = await getRedis();
			const cacheKeys = new Set(
				affectedPermissions.map(({ level_id, department_id }) =>
					getPermissionsCacheKey(level_id, department_id)
				)
			);
			await Promise.all([
				...[...cacheKeys].map((key) => redis?.del(key)),
				invalidateAuthPermissionsCache(),
			]);
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    getNewModules: protectedProcedure.input(
        z.object({
			level_id: z.string(),
			department_id: z.string(),
        })
    )
	.query(async ({ ctx, input }) => {
		const can_view = ctx.permissions[m.PERMISSIONS]?.can_view ?? false;

        if (!can_view) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to view these permissions." 
			});
        }

        const modulesObject = await ctx.db.modules.findMany({
			where: {
				id: {
					notIn: await ctx.db.level_permission.findMany({
						where: {
							level_id: parseInt(input.level_id),
							department_id: parseInt(input.department_id),
						},
						select: {
							module_id: true,
						},
					}).then(records => records.map(r => r.module_id)),
				},
			},
			select: {
				id: true,
				name: true,
				parent_module_id: true,
				modules: {
					select: {
						id: true,
						name: true,
						parent_module_id: true,
						modules: { // grandparent
							select: {
								id: true,
								name: true,
								parent_module_id: true,
							},
						},
					},
				},
			},
        });

        const modules = Array.from(
			new Map(modulesObject.flatMap(m => {
				const items = [{ id: m.id, name: m.name, parent_module_id: m.parent_module_id }];
					// .filter(item => item.id !== DEVELOPER_ID && item.id !== ERROR_LOGS);

					if (m.modules) {
						items.push(m.modules);

						if (m.modules.modules) {
							items.push(m.modules.modules);
						}
					}

					return items;
				}).map(m => [m.id, m]) // dedupe by id
			).values()
        );

        return modules;
    }),

    
    addNewPermissions: protectedProcedure.input(
        z.array(
			z.object({
				module_id: z.number(),
				level_id: z.number(),
				department_id: z.number(),
				can_view: z.boolean().optional(),
				can_add: z.boolean().optional(),
				can_update: z.boolean().optional(),
				can_delete: z.boolean().optional(),
				can_trace: z.boolean().optional(),
			})
        )
    )
    .mutation(async ({ctx, input}) => {
        const can_add = ctx.permissions[m.PERMISSIONS]?.can_add ?? false;

        if (!can_add) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to add these permissions." 
			});
        }

        const addedBy = ctx.user.id;

        try {
			await Promise.all(
				Object.values(input).map((permission) =>
					ctx.db.level_permission.create({
						data: {
							module_id: permission.module_id,
							level_id: permission.level_id,
							department_id: permission.department_id,
							can_view: permission.can_view,
							can_add: permission.can_add,
							can_update: permission.can_update,
							can_delete: permission.can_delete,
							can_trace: permission.can_trace,
							added_by: addedBy,
						}
					})
				)
			);

			const redis = await getRedis();
			const cacheKeys = new Set(
				input.map((permission) =>
					getPermissionsCacheKey(permission.level_id, permission.department_id)
				)
			);
			await Promise.all([
				...[...cacheKeys].map((key) => redis?.del(key)),
				invalidateAuthPermissionsCache(),
			]);
        }
        catch (error) {
            await logError(error, ctx, input);
    		handlePrismaError(error);
        }
    }),
});
