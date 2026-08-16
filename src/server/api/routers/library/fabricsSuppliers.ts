import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const fabricsSuppliersRouter = createTRPCRouter({
    getFabricSuppliers: protectedProcedure.input(
        z.object({
            limit: z.number().min(0).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.FABRIC_SUPPLIER]?.can_view;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view fabric suppliers." 
            });
        }

        const fabricSuppliersObj = await ctx.db.fabric_suppliers.findMany({
            skip: input.offset,
            take: input.limit,
            orderBy: { added_at: "desc" },
            select: {
                id: true,
                name: true,
                contact_person: true,
                email: true,
                phone_no: true,
                address: true,
                website: true,
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const total = await ctx.db.fabric_suppliers.count( );

        const fabricSuppliers = fabricSuppliersObj.map(({ countries, ...rest }) => {
            return {
                ...rest,
                country_name: countries?.name,
                country_id: countries?.id,
            }
        })

        return { fabricSuppliers, total };
    }),


    getFabricSupplierById: protectedProcedure.input(
        z.object({
            id: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.FABRIC_SUPPLIER]?.can_view;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view fabric suppliers." 
            });
        }

        const fabricSupplierObj = await ctx.db.fabric_suppliers.findUnique({
            where: { id: parseInt(input.id) },
            select: {
                id: true,
                name: true,
                contact_person: true,
                email: true,
                phone_no: true,
                address: true,
                website: true,
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const fabricSupplier = fabricSupplierObj ? {
            ...fabricSupplierObj,
            country_name: fabricSupplierObj.countries?.name,
            country_id: fabricSupplierObj.countries?.id,
        } : null;

        return fabricSupplier;
    }),


    addFabricSupplier: protectedProcedure.input(
        z.object({
            name: z.string().min(1).max(255),
            contact_person: z.string().max(255).optional(),
            email: z.string().optional(),
            phone_no: z.string().max(50).optional(),
            address: z.string().optional(),
            website: z.string().optional(),
            country_id: z.number().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_add = ctx.permissions[m.FABRIC_SUPPLIER]?.can_add;

        if(!can_add) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to add fabric suppliers." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const fabricSupplier = await tx.fabric_suppliers.create({
                    data: {
                        name: input.name.trim(),
                        contact_person: input.contact_person,
                        email: input.email,
                        phone_no: input.phone_no,
                        address: input.address?.trim(),
                        website: input.website?.trim(),
                        country_id: input.country_id,
                    },
                });

                await tx.fabric_suppliers_history.create({
                    data: {
                        fabric_suppliers_id: fabricSupplier.id,
                        name: fabricSupplier.name.trim(),
                        contact_person: fabricSupplier.contact_person,
                        email: fabricSupplier.email,
                        phone_no: fabricSupplier.phone_no,
                        address: fabricSupplier.address?.trim(),
                        website: fabricSupplier.website?.trim(),
                        country_id: fabricSupplier.country_id,
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                    },
                })
                return fabricSupplier;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    deleteFabricSupplier: protectedProcedure.input(
        z.object({
            id: z.number(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_delete = ctx.permissions[m.FABRIC_SUPPLIER]?.can_delete;

        if(!can_delete) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to delete fabric suppliers." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                const fabricSupplier = await tx.fabric_suppliers.delete({
                    where: { id: input.id },
                });

                if(!fabricSupplier) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "Fabric supplier not found." 
                    });
                }

                await tx.fabric_suppliers_history.create({
                    data: {
                        fabric_suppliers_id: fabricSupplier.id,
                        name: fabricSupplier.name,
                        contact_person: fabricSupplier.contact_person,
                        email: fabricSupplier.email,
                        phone_no: fabricSupplier.phone_no,
                        address: fabricSupplier.address,
                        website: fabricSupplier.website,
                        country_id: fabricSupplier.country_id,
                        action_type: actions.DELETE,
                        action_by: ctx.user.id,
                    },
                })
            });
        }
        catch (error) {
            await logError(error, ctx, input);
                handlePrismaError(error);
        }
    }),

    updateFabricSupplier: protectedProcedure.input(
        z.object({
            id: z.number(),
            name: z.string().min(1).max(255),
            contact_person: z.string().optional(),
            email: z.string().optional(),
            phone_no: z.string().optional(),
            address: z.string().optional(),
            website: z.string().optional(),
            country_id: z.number().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        const can_edit = ctx.permissions[m.FABRIC_SUPPLIER]?.can_update;

        if(!can_edit) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to update fabric suppliers." 
            });
        }

        try {
            return await ctx.db.$transaction(async (tx) => {
                await tx.fabric_suppliers_history.create({
                    data: {
                        fabric_suppliers_id: input.id,
                        name: input.name.trim(),
                        contact_person: input.contact_person,
                        email: input.email,
                        phone_no: input.phone_no,
                        address: input.address?.trim(),
                        website: input.website?.trim(),
                        country_id: input.country_id,
                        action_type: actions.UPDATE,
                        action_by: ctx.user.id,
                    },
                })

                return await tx.fabric_suppliers.update({
                    where: { id: input.id },
                    data: {
                        name: input.name.trim(),
                        contact_person: input.contact_person,
                        email: input.email,
                        phone_no: input.phone_no,
                        address: input.address?.trim(),
                        website: input.website?.trim(),
                        country_id: input.country_id,
                    },
                });
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    searchFabricSuppliers: protectedProcedure.input(
        z.object({
            query: z.string().min(1),
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),
        })
    ).query(async ({ ctx, input }) => {
        const can_view = ctx.permissions[m.FABRIC_SUPPLIER]?.can_view;

        if(!can_view) {
            throw new TRPCError({ 
                code: "FORBIDDEN", 
                message: "You do not have permission to view fabric suppliers." 
            });
        }

        const fabricSuppliersObj = await ctx.db.fabric_suppliers.findMany({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { contact_person: { contains: input.query, mode: "insensitive" } },
                    { email: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { address: { contains: input.query, mode: "insensitive" } },
                    { website: { contains: input.query, mode: "insensitive" } },
                    { countries: { name: { contains: input.query, mode: "insensitive" } } },
                ],
            },
            skip: input.offset,
            take: input.limit,
            orderBy: { added_at: "desc" },
            select: {
                id: true,
                name: true,
                contact_person: true,
                email: true,
                phone_no: true,
                address: true,
                website: true,
                countries: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const total = await ctx.db.fabric_suppliers.count({
            where: {
                OR: [
                    { name: { contains: input.query, mode: "insensitive" } },
                    { contact_person: { contains: input.query, mode: "insensitive" } },
                    { email: { contains: input.query, mode: "insensitive" } },
                    { phone_no: { contains: input.query, mode: "insensitive" } },
                    { address: { contains: input.query, mode: "insensitive" } },
                    { website: { contains: input.query, mode: "insensitive" } },
                    { countries: { name: { contains: input.query, mode: "insensitive" } } },
                ],
            },
        });

        const fabricSuppliers = fabricSuppliersObj.map(({ countries, ...rest }) => {
            return {
                ...rest,
                country_name: countries?.name,
                country_id: countries?.id,
            }
        });

        return { fabricSuppliers, total };
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.fabric_suppliers.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
            }
        });
    }),

});
