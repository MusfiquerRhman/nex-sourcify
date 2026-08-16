import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const authorizationsRouter = createTRPCRouter({
	getAuthorizationModules: protectedProcedure.query(async ({ ctx }) => {
		const can_view = ctx.permissions[m.AUTHORIZATIONS]?.can_view ?? false;

		if (!can_view) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to view these authorizations." 
			});
		}

		const authorizationsObj = await ctx.db.authorizations.findMany({
			select: {
				id: true,
				modules: {
					select: {
						name: true,
					}
				},
				levels: {
					select: {
						name: true,
						id: true,
					}
				},
				updated_at: true,
				users: {
					select: {
						id: true,
						user_id: true,
					}
				},
				departments: {
					select: {
					name: true,
					}
				},
				name: true,
			},
			orderBy: {
			module_id: "asc",
			}
		});

		const authorizations = authorizationsObj.map(({modules, levels, users, departments, ...rest}) => ({
			...rest, 
			module_name: modules?.name,
			level_name: levels?.name,
			level_id: levels?.id,
			department_name: departments?.name,
			updated_by: users?.user_id,
		}))

		return authorizations;
	}),

  	upDateAuthorizationLevels: protectedProcedure.input(
		z.object({
			changes: z.array(
				z.object({
					id: z.number(),
					level_id: z.number(),
				})
			)
		})
  	).mutation(async ({ ctx, input }) => {
		const can_update = ctx.permissions[m.AUTHORIZATIONS]?.can_update ?? false;

		if (!can_update) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to update these authorizations." 
			});
		}

		try {
			for (const change of input.changes) {
				await ctx.db.authorizations.update({
					where: { id: change.id },
					data: { level_id: change.level_id, updated_by: ctx.user.id },
				});
			}
		}
		catch (error) {
			await logError(error, ctx, input);
    		handlePrismaError(error);
		}
	}),
});