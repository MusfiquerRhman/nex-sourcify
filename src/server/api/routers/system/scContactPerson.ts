import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";

export const scContactPersonRouter = createTRPCRouter({
    getContactPersons: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SC_CONTACT_PERSON]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view contact persons." 
                });
            }

            const contactPersons = await ctx.db.sales_contract_contact_person.findMany({
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    pabx: true,
                    ext: true,
                    contact_number: true,
                },
            });

            const total = await ctx.db.sales_contract_contact_person.count();

            return {contactPersons, total};
        }),

    searchContactPersons: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).optional(),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SC_CONTACT_PERSON]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view contact persons." 
                });
            }

            const contactPersons = await ctx.db.sales_contract_contact_person.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { email: { contains: input.query, mode: "insensitive" } },
                        { pabx: { contains: input.query, mode: "insensitive" } },
                        { contact_number: { contains: input.query, mode: "insensitive" } },
                    ],
                },
                take: input.limit,
                skip: input.offset,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    pabx: true,
                    ext: true,
                    contact_number: true,
                },
            });

            const total = await ctx.db.sales_contract_contact_person.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: "insensitive" } },
                        { email: { contains: input.query, mode: "insensitive" } },
                        { pabx: { contains: input.query, mode: "insensitive" } },
                        { contact_number: { contains: input.query, mode: "insensitive" } },
                    ],
                },
            });

            return { contactPersons, total };
        }),

    getContactPersonById: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.SC_CONTACT_PERSON]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view contact persons." 
                });
            }

            const contactPerson = await ctx.db.sales_contract_contact_person.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    pabx: true,
                    ext: true,
                    contact_number: true,
                },
            });

            return contactPerson;
        }),

    addContactPerson: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                email: z.string().email(),
                pabx: z.string().optional(),
                ext: z.number().optional(),
                contact_number: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.SC_CONTACT_PERSON]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add contact persons." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const contactPerson = await tx.sales_contract_contact_person.create({
                        data: {
                            name: input.name.trim(),
                            email: input.email.trim(),
                            pabx: input.pabx,
                            ext: input.ext,
                            contact_number: input.contact_number,
                        },
                    });

                    await tx.sales_contract_contact_person_history.create({
                        data: {
                            sales_contract_contact_person_id: contactPerson.id,
                            name: contactPerson.name.trim(),
                            email: contactPerson.email?.trim(),
                            pabx: contactPerson.pabx,
                            ext: contactPerson.ext,
                            contact_number: contactPerson.contact_number,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    return contactPerson;
                });
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateContactPerson: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
                name: z.string().min(1),
                email: z.string().email(),
                pabx: z.string().optional(),
                ext: z.number().optional(),
                contact_number: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.SC_CONTACT_PERSON]?.can_update;
            
            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update contact persons." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const contactPerson = await tx.sales_contract_contact_person.update({
                        where: { id: input.id },
                        data: {
                            name: input.name.trim(),
                            email: input.email.trim(),
                            pabx: input.pabx,
                            ext: input.ext,
                            contact_number: input.contact_number,
                        },
                    });

                    await tx.sales_contract_contact_person_history.create({
                        data: {
                            sales_contract_contact_person_id: input.id,
                            name: input.name.trim(),
                            email: input.email.trim(),
                            pabx: input.pabx,
                            ext: input.ext,
                            contact_number: input.contact_number,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                        },
                    });

                    return contactPerson;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteContactPerson: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.SC_CONTACT_PERSON]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete contact persons." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const contactPerson = await tx.sales_contract_contact_person.delete({
                        where: { id: input.id },
                    });

                    await tx.sales_contract_contact_person_history.create({
                        data: {
                            sales_contract_contact_person_id: input.id,
                            name: contactPerson.name,
                            email: contactPerson.email,
                            pabx: contactPerson.pabx,
                            ext: contactPerson.ext,
                            contact_number: contactPerson.contact_number,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });

                    return contactPerson;
                }); 
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
        try {
            return await ctx.db.sales_contract_contact_person.findMany({
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                },
            });
        }
        catch (error) {
                        handlePrismaError(error);
        }
    }),
});
