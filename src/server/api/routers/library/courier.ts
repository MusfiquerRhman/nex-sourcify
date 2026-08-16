import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const courierRouter = createTRPCRouter({
    getCouriers: protectedProcedure.input(
        z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.COURIERS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view couriers." 
            });
        }

        const couriers = await ctx.db.couriers.findMany({
            orderBy: { added_at: 'desc' },
            skip: input.offset,
            take: input.limit,
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                contact_person: true,
                phone_no: true,
                website: true,
            },
        });

        const total = await ctx.db.couriers.count();

        return { couriers, total };
    }),

    getCourierById: protectedProcedure.input(
        z.object({
            id: z.string().min(1),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.COURIERS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view couriers." 
            });
        }

        const courier = await ctx.db.couriers.findUnique({
            where: { id: parseInt(input.id) },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                contact_person: true,
                phone_no: true,
                website: true,
            },
        });

        if (!courier) {
            throw new TRPCError({ 
                code: "NOT_FOUND", 
                message: "Courier not found." 
            });
        }

        return courier;
    }),

    addCourier: protectedProcedure.input(
        z.object({
            name: z.string().min(1),
            email: z.string().email().optional().or(z.literal("")),
            address: z.string().optional(),
            contact_person: z.string().optional(),
            phone_no: z.string().optional(),
            website: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.COURIERS]?.can_add ?? false;

        if (!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add couriers." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const courier = await tx.couriers.create({
                    data: {
                        name: input.name.trim(),
                        email: input.email,
                        contact_person: input.contact_person,
                        address: input.address?.trim(),
                        phone_no: input.phone_no,
                        website: input.website,
                    },
                });

                await tx.courier_history.create({
                    data: {
                        courier_id: courier.id,
                        name: courier.name.trim(),
                        email: courier.email,
                        address: courier.address?.trim(),
                        contact_person: courier.contact_person,
                        phone_no: courier.phone_no,
                        website: courier.website,
                        action_type: 'ADDED',
                        action_by: ctx.user.id,
                    },
                });

                return courier;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    deleteCourier: protectedProcedure.input(
        z.object({
            id: z.number().min(1),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.COURIERS]?.can_delete ?? false;

        if (!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete couriers." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const courier = await tx.couriers.delete({
                    where: { id: input.id },
                });

                await tx.courier_history.create({
                    data: {
                        courier_id: courier.id,
                        name: courier.name.trim(),
                        email: courier.email,
                        contact_person: courier.contact_person,
                        phone_no: courier.phone_no,
                        website: courier.website,
                        action_type: 'DELETE',
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

    updateCourier: protectedProcedure.input(
        z.object({
            id: z.number().min(1),
            name: z.string().min(1).optional(),
            email: z.string().email().optional().or(z.literal("")),
            address: z.string().optional(),
            contact_person: z.string().optional(),
            phone_no: z.string().optional(),
            website: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_edit = ctx.permissions[m.COURIERS]?.can_update ?? false;

        if (!can_edit) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to edit couriers." });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                await tx.courier_history.create({
                    data: {
                        courier_id: input.id,
                        name: input.name?.trim() ?? '',
                        email: input.email,
                        contact_person: input.contact_person,
                        address: input.address?.trim(),
                        phone_no: input.phone_no,
                        website: input.website,
                        action_type: 'UPDATE',
                        action_by: ctx.user.id,
                    },
                });

                const updatedCourier = await tx.couriers.update({
                    where: { id: input.id },
                    data: {
                        name: input.name?.trim(),
                        email: input.email,
                        address: input.address?.trim(),
                        contact_person: input.contact_person,
                        phone_no: input.phone_no,
                        website: input.website,
                    },
                });

                return updatedCourier;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    searchCouriers: protectedProcedure.input(
        z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.COURIERS]?.can_view ?? false;

        if (!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view couriers." 
            });
        }

        const couriers = await ctx.db.couriers.findMany({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { email: { contains: input.query, mode: "insensitive" } },
                    { contact_person: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { website: { contains: input.query, mode: "insensitive" } },
                    { address: { contains: input.query, mode: "insensitive" } },
                ],
            },
            skip: input.offset,
            take: input.limit,
            select: {
                id: true,
                name: true,
                email: true,
                contact_person: true,
                address: true,
                phone_no: true,
                website: true,
            },
        });

        const total = await ctx.db.couriers.count({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { email: { contains: input.query, mode: "insensitive" } },
                    { contact_person: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { website: { contains: input.query, mode: "insensitive" } },
                    { address: { contains: input.query, mode: "insensitive" } },
                ],
            },
        });

        return { couriers, total };
    }),

    getAllCouriers: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.couriers.findMany({
            orderBy: { added_at: 'desc' },
            select: {
                id: true,
                name: true
            },
        });
    }),
});