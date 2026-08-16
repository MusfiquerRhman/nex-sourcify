import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const teamsRouter = createTRPCRouter({
    getTeams: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0), 
        })
    ).query(async ({ input, ctx }) => {
        const can_view = ctx.permissions[m.TEAMS]?.can_view;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view teams." 
            });
        }

        const teamsObj = await ctx.db.teams.findMany({
            take: input.limit,
            skip: input.offset,
            orderBy: { added_at: "desc" },
            select: {
                id: true,
                team_name: true,
                buyers: {
                    select: {
                        id: true,
                        buyer_name: true,
                    }
                }
            }
        });

        const totalTeams = await ctx.db.teams.count();

        const teams = teamsObj.map(({buyers, ...team}) => ({
            ...team,
            buyer_name: buyers?.buyer_name,
            buyer_id: buyers?.id,
        }));

        return { teams, totalTeams };
    }),

    getTeamById: protectedProcedure
        .input(z.object({
            id: z.number(),
        })
    ).query(async ({ input, ctx }) => {
        const can_view = ctx.permissions[m.TEAMS]?.can_view;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN",
                message: "You do not have permission to view teams." 
            });
        }

        const teamObj = await ctx.db.teams.findUnique({
            where: { id: input.id },
            select: {
                id: true,
                team_name: true,
                buyers: {
                    select: {
                        id: true,
                        buyer_name: true,
                    }
                }
            }
        });

        const team = teamObj ? {
            ...teamObj,
            buyer_name: teamObj.buyers?.buyer_name,
            buyer_id: teamObj.buyers?.id,
        } : null;

        const teamMembersObj = await ctx.db.team_members.findMany({
            where: { team_id: input.id },
            select: {
                id: true,
                teams: {
                    select: {
                        id: true,
                        team_name: true,
                    }
                },
                users: {
                    select: {
                        id: true,
                        user_id: true,
                    }
                },
            }
        });

        const teamMembers = teamMembersObj.map(({teams, users, ...member}) => ({
            ...member,
            team_name: teams?.team_name,
            user_id: users?.id,
            user_user_id: users?.user_id,
        }));

        return { team, teamMembers };
    }),

    addTeam: protectedProcedure
        .input(z.object({
            team_name: z.string().min(1),
            buyer_id: z.number().nullable(),
            membersData: z.array(z.object({
                user_id: z.string(),
            })),
        })
    ).mutation(async ({ input, ctx }) => {
        const can_add = ctx.permissions[m.TEAMS]?.can_add;

        if (!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add teams." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const newTeam = await tx.teams.create({
                    data: {
                        team_name: input.team_name,
                        buyer_id: input.buyer_id,
                    }
                });

                await tx.teams_history.create({
                    data: {
                        team_id: newTeam.id,
                        team_name: input.team_name,
                        buyer_id: input.buyer_id,
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    }
                });

                if(input.membersData.length) {
                    for (const member of input.membersData) {
                        const members = await tx.team_members.create({
                            data: {
                                team_id: newTeam.id,
                                user_id: member.user_id,
                            }
                        });

                        await tx.team_members_history.create({
                            data: {
                                team_member_id: members.id,
                                team_id: newTeam.id,
                                user_id: member.user_id,
                                action_type: actions.ADDED,
                                action_by: ctx.user.id,
                            }
                        });
                    }
                }
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    deleteTeam: protectedProcedure
        .input(z.object({
            id: z.number(),
        })
    ).mutation(async ({ input, ctx }) => {
        const can_delete = ctx.permissions[m.TEAMS]?.can_delete;

        if (!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete teams." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const teamMembersToDelete = await tx.team_members.findMany({
                    where: { team_id: input.id },
                });

                for (const member of teamMembersToDelete) {
                    await tx.team_members_history.create({
                        data: {
                            team_member_id: member.id,
                            team_id: member.team_id,
                            user_id: member.user_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });

                    await tx.team_members.delete({
                        where: { id: member.id },
                    });
                }
                
                const teamToDelete = await tx.teams.delete({
                    where: { id: input.id },
                })

                if (!teamToDelete) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Team not found." 
                    });
                }

                await tx.teams_history.create({
                    data: {
                        team_id: teamToDelete.id,
                        team_name: teamToDelete.team_name,
                        buyer_id: teamToDelete.buyer_id,
                        action_type: actions.DELETE,
                        action_by: ctx.user.id,
                    }
                });
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),


    updateTeam: protectedProcedure
        .input(z.object({
            id: z.number(),
            team_name: z.string().min(1),
            buyer_id: z.number().min(1),
            members: z.array(z.object({
                user_id: z.string(),
                db_id: z.string().optional(),
            })).optional(),
        })
    ).mutation(async ({ input, ctx }) => {
        const can_edit = ctx.permissions[m.TEAMS]?.can_update;

        if (!can_edit) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to update teams." 
            });
        }

        try {
            await ctx.db.$transaction(async (tx) => {
                const updatedTeam = await tx.teams.update({
                    where: { id: input.id },
                    data: {
                        team_name: input.team_name,
                        buyer_id: input.buyer_id,
                    }
                });

                await tx.teams_history.create({
                    data: {
                        team_id: updatedTeam.id,
                        team_name: input.team_name,
                        buyer_id: input.buyer_id,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    }
                });

                if (input.members && input.members.length > 0) {
                    for (const member of input.members) {
                        if (member.db_id) {
                            // UPDATE
                            const teamMember = await tx.team_members.update({
                                where: { id: parseInt(member.db_id) },
                                data: {
                                    user_id: member.user_id,
                                },
                            });

                            await tx.team_members_history.create({
                                data: {
                                    team_member_id: teamMember.id,
                                    team_id: input.id,
                                    user_id: member.user_id,
                                    action_type: actions.UPDATE,
                                    action_by: ctx.user.id,
                                },
                            });

                        } else {
                            // CREATE
                            const teamMember = await tx.team_members.create({
                                data: {
                                    team_id: input.id,
                                    user_id: member.user_id,
                                },
                            });

                            await tx.team_members_history.create({
                                data: {
                                    team_member_id: teamMember.id,
                                    team_id: input.id,
                                    user_id: member.user_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }
                }
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    searchTeams: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0), 
        })
    ).query(async ({ input, ctx }) => {
        const can_view = ctx.permissions[m.TEAMS]?.can_view;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view teams." 
            });
        }

        const teamsObj = await ctx.db.teams.findMany({
            where: {
                OR: [
                    { team_name: { contains: input.query, mode: "insensitive" } },
                    { buyers: { buyer_name: { contains: input.query, mode: "insensitive" } } },
                ]
            },
            select: {
                id: true,
                team_name: true,
                buyers: {
                    select: {
                        id: true,
                        buyer_name: true,
                    }
                }
            }
        });

        const teams = teamsObj.map(({buyers, ...team}) => ({
            ...team,
            buyer_name: buyers?.buyer_name,
            buyer_id: buyers?.id,
        }));

        const total = await ctx.db.teams.count({
            where: {
                OR: [
                    { team_name: { contains: input.query, mode: "insensitive" } },
                    { buyers: { buyer_name: { contains: input.query, mode: "insensitive" } } },
                ]
            }
        });

        return { teams, total };
    }),

    deleteTeamMember: protectedProcedure
        .input(z.object({
            id: z.number(),
        })
    ).mutation(async ({ input, ctx }) => {
        const can_delete = ctx.permissions[m.TEAMS]?.can_delete;

        if (!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete team members." 
            });
        }

        return await ctx.db.$transaction(async (tx) => {
            const memberToDelete = await tx.team_members.delete({
                where: { id: input.id },
            })

            if (!memberToDelete) {
                throw new TRPCError({ 
                    code: "NOT_FOUND", 
                    message: "Team member not found." 
                });
            }

            await tx.team_members_history.create({
                data: {
                    team_member_id: memberToDelete.id,
                    team_id: memberToDelete.team_id,
                    user_id: memberToDelete.user_id,
                    action_type: actions.DELETE,
                    action_by: ctx.user.id,
                }
            });
        });
    }),

    getTeamsByBuyer: protectedProcedure
        .input(
            z.number().min(1)
        ).query(async ({ input, ctx }) => {
            const teams = await ctx.db.teams.findMany({
                where: { buyer_id: input },
                select: {
                    id: true,
                    team_name: true,
                }
            });

            return teams;
        }),

    getTeamsByBuyers: protectedProcedure
        .input(
            z.array(z.number().min(1))
        ).query(async ({ input, ctx }) => {
            const teams = await ctx.db.teams.findMany({
                where: { buyer_id: { in: input } },
                select: {
                    id: true,
                    team_name: true,
                }
            });
            return teams;
        }),

    getTeamMemberByLevel: protectedProcedure
        .input(z.object({
            team_id: z.number(),
            level_id: z.number(),
        })).query(async ({ input, ctx }) => {
            const usersObj = await ctx.db.users.findMany({
                where: {
                    level_id: input.level_id,
                    team_members: {
                        some: {
                            team_id: input.team_id,
                        },
                    },
                },
                select: {
                    id: true,
                    user_id: true,
                },
            });

            const users = usersObj.map(user => ({
                id: user.id,
                user_id: user.user_id,
            }));

            return users;
        }),
});
