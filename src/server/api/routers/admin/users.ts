import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { actions } from "@prisma/client";

export const userRouter = createTRPCRouter({
	// Fetch a single user by ID
	getUser: protectedProcedure.input(
		z.object({
			id: z.string(),
		})
		).query(async ({ ctx, input }) => {
			const can_view = ctx.permissions[m.USERS]?.can_view ?? false;

			if (!can_view) {
				throw new TRPCError({ 
					code: "FORBIDDEN", 
					message: "You do not have permission to view this user." 
				});
			}
			
			const usersObj = await ctx.db.users.findUnique({
				where: { id: input.id },
				select: {
				id: true,
				first_name: true,
				last_name: true,
				user_id: true,
				email: true,
				password: true,
				created_at: true,
				phone_no: true,
				is_active: true,
				departments: {
					select: {
						id: true,
						name: true
					}
				},
				levels: {
					select: {
						id: true,
						name: true
					}
				},
			},
		});

		// flatten the relations
		const user = usersObj ? {
			...usersObj,
			department_id: usersObj.departments.id,
			level_id: usersObj.levels?.id,
		} : null;

		return user;
    }),

	// Fetch paginated list of users
	getUsers: protectedProcedure.input(
		z.object({
			limit: z.number().min(0).default(15),
			offset: z.number().min(0).default(0),
		})
    ).query(async ({ ctx, input }) => {
		const can_view = ctx.permissions[m.USERS]?.can_view ?? false;

		if (!can_view) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to view users." 
			});
		}

		const usersObj = await ctx.db.users.findMany({
			select: {
				id: true,
				first_name: true,
				last_name: true,
				user_id: true,
				email: true,
				password: true,
				created_at: true,
				phone_no: true,
				is_active: true,
				departments: {
					select: {
						name: true
					}
				},
				levels: {
					select: {
						name: true
					}
				},
			},
			skip: input.offset,
			take: input.limit,
			orderBy: { created_at: "desc" },
		});

		const total = await ctx.db.users.count();

		// flatten the relations
		const users = usersObj.map(({ departments, levels, ...rest }) => ({
			...rest,
			department_name: departments.name,
			level_name: levels?.name,
		}));


		return { users, total };
    }),

    // Add a new user
    addUser: protectedProcedure.input(
        z.object({
			first_name: z.string(),
			last_name: z.string().optional(),
			user_id: z.string(),
			department_id: z.string(),
			password: z.string(),
			level_id: z.string(),
			is_active: z.boolean(),
			email: z.string(),
			phone_no: z.string(),
        })
    ).mutation(async ({ctx, input}) => {
        const can_add = ctx.permissions[m.USERS]?.can_add ?? false;

        if (!can_add) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to add a user." 
			});
        }

        try {
			return await ctx.db.$transaction(async (tx) => {
				const user = await tx.users.create({
					data: {
						first_name: input.first_name,
						last_name: input.last_name ?? undefined,
						user_id: input.user_id,
						password: input.password,
						hashed_password: await bcrypt.hash(input.password, 10), // Hash password
						is_active: input.is_active,
						email: input.email,
						phone_no: input.phone_no,
						departments: {
						connect: { id: parseInt(input.department_id) },
						},
						levels: {
							connect: { id: parseInt(input.level_id) },
						},
					},
				});

				await tx.users_history.create({
					data: {
						users_id: user.id,
						first_name: user.first_name,
						last_name: user.last_name,
						user_id: user.user_id,
						password: user.password,
						is_active: user.is_active,
						email: user.email,
						phone_no: user.phone_no,              
						department_id: parseInt(input.department_id),
						level_id: parseInt(input.level_id),
						action_type: actions.ADDED,
						action_by: ctx.user.id,
					},
				});
			});
        }
        catch (error) {
            await logError(error, ctx, input);
    		handlePrismaError(error);
        }
    }),

    // Update an existing user
    updateUser: protectedProcedure.input(
        z.object({
			id: z.string(),
			first_name: z.string(),
			last_name: z.string().optional(),
			user_id: z.string(),
			department_id: z.number(),
			password: z.string(),
			level_id: z.number(),
			is_active: z.boolean(),
			email: z.string().optional(),
			phone_no: z.string().optional(),
        })
    ).mutation(async ({ctx, input}) => {
        const can_update = ctx.permissions[m.USERS]?.can_update ?? false;

        if (!can_update) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to update a user." 
			});
        }
        
        try {
			return await ctx.db.$transaction(async (tx) => {
				const user = await tx.users.findUnique({
					where: { id: input.id },
				});

				if (!user) {
					throw new TRPCError({ 
						code: "NOT_FOUND", 
						message: "User not found." 
					});
				}

				await tx.users_history.create({
					data: {
						users_id: user.id,
						first_name: user.first_name,
						last_name: user.last_name,
						user_id: user.user_id,
						password: user.password,
						is_active: user.is_active,
						email: user.email,
						phone_no: user.phone_no,
						department_id: user.department_id,
						level_id: user.level_id,
						action_type: actions.UPDATE,
						action_by: ctx.user.id,
					},
				});

				return await tx.users.update({
					where: { id: input.id },
						data: {
							first_name: input.first_name,
							last_name: input.last_name ?? undefined,
							user_id: input.user_id,
							password: input.password,
							hashed_password: await bcrypt.hash(input.password, 10),
							is_active: input.is_active,
							email: input.email ?? undefined,
							phone_no: input.phone_no ?? undefined,
							departments: {
							connect: { id: input.department_id },
						},
						levels: {
							connect: { id: input.level_id },
						},
					},
				});
			});
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    // Search users by query string
    searchUsers: protectedProcedure.input(
        z.object({
			query: z.string(),
			limit: z.number().min(0).default(15),
			offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.USERS]?.can_view ?? false;

        if (!can_view) {
			throw new TRPCError({ 
				code: "FORBIDDEN", 
				message: "You do not have permission to view users." 
			});
        }

        const usersObj = await ctx.db.users.findMany({
			select: {
				id: true,
				first_name: true,
				last_name: true,
				user_id: true,
				email: true,
				password: true,
				created_at: true,
				phone_no: true,
				is_active: true,
				departments: {
					select: {
						name: true
					}
				},
				levels: {
					select: {
					name: true
					}
				},
			},
			where: {
				OR: [
					{ first_name: { contains: input.query, mode: "insensitive" } },
					{ last_name: { contains: input.query, mode: "insensitive" } },
					{ user_id: { contains: input.query, mode: "insensitive" } },
					{ email: { contains: input.query, mode: "insensitive" } },
					{ phone_no: { contains: input.query, mode: "insensitive" } },
					{ departments: { name: { contains: input.query, mode: "insensitive" } } },
					{ levels: { name: { contains: input.query, mode: "insensitive" } } },
				],
			},
			skip: input.offset,
			take: input.limit,
			orderBy: { created_at: "desc" },
        });

        // Get total count for the search query
        const total = await ctx.db.users.count({
          where: {
            OR: [
              { first_name: { contains: input.query, mode: "insensitive" } },
              { last_name: { contains: input.query, mode: "insensitive" } },
              { user_id: { contains: input.query, mode: "insensitive" } },
              { email: { contains: input.query, mode: "insensitive" } },
              { phone_no: { contains: input.query, mode: "insensitive" } },
              { departments: { name: { contains: input.query, mode: "insensitive" } } },
              { levels: { name: { contains: input.query, mode: "insensitive" } } },
            ],
          },
        });

        // flatten the relations
        const users = usersObj.map(({ departments, levels, ...rest }) => ({
			...rest,
			department_name: departments.name,
			level_name: levels?.name,
        }));

        return { users: users, total };
    }),

    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
        const usersObj = await ctx.db.users.findMany({
			select: {
				id: true,
				user_id: true,
				departments: {
					select: {
						id: true,
						name: true
					}
				},
				levels: {
					select: {
						id: true,
						name: true
					}
				},
			},
			orderBy: { user_id: "asc" },
        });

        const users = usersObj.map(({ departments, levels, ...rest }) => ({
			...rest,
			department_id: departments.id,
			department_name: departments.name,
			level_id: levels?.id,
			level_name: levels?.name,
        }));

        return users;
    }),
});