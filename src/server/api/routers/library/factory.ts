import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const factoryRouter = createTRPCRouter({
    getFactories: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).default(15),
            offset: z.number().min(0).default(0),            
        })
    ).query(async ({ input, ctx }) => {
        const can_view = ctx.permissions[m.FACTORIES]?.can_view;

        if (!can_view) {
            throw new TRPCError({ 
                code: 'FORBIDDEN', 
                message: 'You do not have permission to view factories.' 
            });
        }

        const factories = await ctx.db.factories.findMany({
            take: input.limit,
            skip: input.offset,
            orderBy: { added_at: 'desc' },
            select: {
                id: true,
                name: true,
                office_address: true,
                factory_address: true,
                contact_person: true,
                email: true,
                prefix: true,
                phone_no: true,
                website: true,
            }
        });

        const totalFactories = await ctx.db.factories.count();

        return {
            factories: factories,
            total: totalFactories,
        };
    }),

    getFactoryById: protectedProcedure
        .input(z.object({
            id: z.number().min(1),
        }))
        .query(async ({ input, ctx }) => {
            const can_view = ctx.permissions[m.FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view factory details.' 
                });
            }

            const factory = await ctx.db.factories.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    office_address: true,
                    factory_address: true,
                    contact_person: true,
                    email: true,
                    prefix: true,
                    phone_no: true,
                    website: true,
                }
            });
            
            const factoryBanks = await ctx.db.factory_bank.findMany({
                where: { factory_id: input.id },
                select: {
                    id: true,
                    bank_id: true,
                    branch_name: true,
                    account_no: true,
                    account_name: true,
                    swift_code: true,
                    address: true,
                }
            });

            return { factory, factoryBanks };
        }),

        addFactory: protectedProcedure
            .input(z.object({
                name: z.string().min(1).max(255),
                office_address: z.string().max(500).optional(),
                factory_address: z.string().max(500).optional(),
                contact_person: z.string().max(255).optional(),
                email: z.string().max(255).optional(),
                prefix: z.string().min(1).max(10),
                phone_no: z.string().max(20).optional(),
                website: z.string().max(255).optional(),
                factory_banks: z.array(z.object({
                    bank_id: z.number().min(1),
                    branch_name: z.string().min(2).max(255),
                    account_no: z.string().min(5).max(50),
                    account_name: z.string().min(2).max(255),
                    swift_code: z.string().max(50).optional(),
                    address: z.string().max(500).optional(),
                })).optional(),
            }))
            .mutation(async ({ input, ctx }) => {
                const can_add = ctx.permissions[m.FACTORIES]?.can_add;

                if (!can_add) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to add factories.' 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        const factory = await tx.factories.create({
                            data: {
                                name: input.name.trim(),
                                office_address: input.office_address?.trim(),
                                factory_address: input.factory_address?.trim(),
                                contact_person: input.contact_person,
                                email: input.email,
                                prefix: input.prefix,
                                phone_no: input.phone_no,
                                website: input.website?.trim(),
                            }
                        });

                        if (input.factory_banks && input.factory_banks.length > 0) {
                            await tx.factory_bank.createMany({
                                data: input.factory_banks.map(bank => ({
                                    factory_id: factory.id,
                                    bank_id: bank.bank_id,
                                    branch_name: bank.branch_name,
                                    account_no: bank.account_no,
                                    account_name: bank.account_name,
                                    swift_code: bank.swift_code,
                                    address: bank.address,
                                }))
                            });
                        }

                        await tx.factory_history.create({
                            data: {
                                factory_id: factory.id,
                                action_type: 'ADDED',
                                name: input.name.trim(),
                                office_address: input.office_address?.trim(),
                                factory_address: input.factory_address?.trim(),
                                contact_person: input.contact_person,
                                email: input.email,
                                prefix: input.prefix,
                                phone_no: input.phone_no,
                                website: input.website?.trim(),
                                action_by: ctx.user.id,

                            }
                        });

                        await tx.factory_bank_history.createMany({
                            data: (input.factory_banks ?? []).map((bank) => ({
                                factory_id: factory.id,
                                bank_id: bank.bank_id,
                                branch_name: bank.branch_name,
                                account_no: bank.account_no,
                                account_name: bank.account_name,
                                swift_code: bank.swift_code,
                                address: bank.address,
                                action_type: 'ADDED',
                                action_by: ctx.user.id,
                            }))
                        });

                        return factory;
                    });
                }
                catch (error) {
                    await logError(error, ctx, input);
                                handlePrismaError(error);
                }
            }),

        deleteFactory: protectedProcedure
            .input(z.object({
                id: z.number().min(1),
            }))
            .mutation(async ({ input, ctx }) => {
                const can_delete = ctx.permissions[m.FACTORIES]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to delete factories.' 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        await tx.factory_bank_history.createMany({
                            data: (await tx.factory_bank.findMany({
                                where: { factory_id: input.id },
                            })).map((bank) => ({
                                factory_bank_id: bank.id,
                                factory_id: bank.factory_id,
                                bank_id: bank.bank_id,
                                branch_name: bank.branch_name,
                                account_no: bank.account_no,
                                account_name: bank.account_name,
                                swift_code: bank.swift_code,
                                address: bank.address,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            }))
                        });

                        await tx.factory_bank.deleteMany({
                            where: { factory_id: input.id },
                        });

                        const factory = await tx.factories.delete({
                            where: { id: input.id },
                        });

                        if (!factory) {
                            throw new TRPCError({ 
                                code: 'NOT_FOUND', 
                                message: 'Factory not found.' 
                            });
                        }

                        await tx.factory_history.create({
                            data: {
                                factory_id: factory.id,
                                action_type: 'DELETE',
                                name: factory.name,
                                office_address: factory.office_address,
                                factory_address: factory.factory_address,
                                contact_person: factory.contact_person,
                                email: factory.email,
                                prefix: factory.prefix,
                                phone_no: factory.phone_no,
                                website: factory.website,
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

        updateFactory: protectedProcedure
            .input(z.object({
                id: z.number().min(1),
                name: z.string().min(1).max(255).optional(),
                office_address: z.string().max(500).optional(),
                factory_address: z.string().max(500).optional(),
                contact_person: z.string().max(255).optional(),
                email: z.string().optional(),
                prefix: z.string().max(10).optional(),
                phone_no: z.string().max(20).optional(),
                website: z.string().max(255).optional(),
                factory_banks: z.array(z.object({
                    db_id: z.number().min(1).optional(),
                    bank_id: z.number().min(1),
                    factory_id: z.number().min(1).optional(),
                    branch_name: z.string().min(2).max(255),
                    account_no: z.string().min(5).max(50),
                    account_name: z.string().min(2).max(255),
                    swift_code: z.string().max(50).optional(),
                    address: z.string().max(500).optional(),
                })).optional(),
            }))
            .mutation(async ({ input, ctx }) => {
                const can_edit = ctx.permissions[m.FACTORIES]?.can_update;

                if (!can_edit) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to update factories.' 
                    });
                }

                try {
                    return await ctx.db.$transaction(async (tx) => {
                        await tx.factory_history.create({
                            data: {
                                factory_id: input.id,
                                action_type: 'UPDATE',
                                name: input.name?.trim() ?? '',
                                office_address: input.office_address?.trim(),
                                factory_address: input.factory_address?.trim(),
                                contact_person: input.contact_person,
                                email: input.email,
                                prefix: input.prefix,
                                phone_no: input.phone_no,
                                website: input.website?.trim(),
                                action_by: ctx.user.id,
                            }
                        });

                        await tx.factories.update({
                            where: { id: input.id },
                            data: {
                                name: input.name?.trim(),
                                office_address: input.office_address?.trim(),
                                factory_address: input.factory_address?.trim(),
                                contact_person: input.contact_person,
                                email: input.email,
                                prefix: input.prefix,
                                phone_no: input.phone_no,
                                website: input.website?.trim(),
                            }
                        });

                        // Update factory banks
                        if (input.factory_banks && input.factory_banks.length > 0) {
                            for (const bank of input.factory_banks) {
                                const upsertedBank = await tx.factory_bank.upsert({
                                    where: { id: bank.db_id ?? 0 }, // if db_id exists, use it, else force create
                                    update: {
                                        bank_id: bank.bank_id,
                                        branch_name: bank.branch_name?.trim(),
                                        account_no: bank.account_no?.trim(),
                                        account_name: bank.account_name?.trim(),
                                        swift_code: bank.swift_code?.trim(),
                                        address: bank.address?.trim(),
                                    },
                                    create: {
                                        factory_id: input.id,
                                        bank_id: bank.bank_id,
                                        branch_name: bank.branch_name?.trim(),
                                        account_no: bank.account_no?.trim(),
                                        account_name: bank.account_name?.trim(),
                                        swift_code: bank.swift_code?.trim(),
                                        address: bank.address?.trim(),
                                    },
                                });

                                await tx.factory_bank_history.create({
                                    data: {
                                        factory_bank_id: upsertedBank.id,
                                        factory_id: input.id,
                                        bank_id: bank.bank_id,
                                        branch_name: bank.branch_name?.trim(),
                                        account_no: bank.account_no?.trim(),
                                        account_name: bank.account_name?.trim(),
                                        swift_code: bank.swift_code?.trim(),
                                        address: bank.address?.trim(),
                                        action_type: bank.db_id ? 'UPDATE' : 'ADDED',
                                        action_by: ctx.user.id,
                                    },
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

        removeFactoryBank: protectedProcedure
            .input(z.object({
                id: z.number().min(1),
            }))
            .mutation(async ({ input, ctx }) => {
                const can_delete = ctx.permissions[m.FACTORIES]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: 'You do not have permission to delete factory banks.' 
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const factoryBank = await tx.factory_bank.findUnique({
                        where: { id: input.id },
                    });

                    if (!factoryBank) {
                        throw new TRPCError({ 
                            code: 'NOT_FOUND', 
                            message: 'Factory bank not found.' 
                        });
                    }

                    await tx.factory_bank_history.create({
                        data: {
                            factory_bank_id: factoryBank.id,
                            factory_id: factoryBank.factory_id,
                            bank_id: factoryBank.bank_id,
                            branch_name: factoryBank.branch_name,
                            account_no: factoryBank.account_no,
                            account_name: factoryBank.account_name,
                            swift_code: factoryBank.swift_code,
                            address: factoryBank.address,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        }
                    });

                    await tx.factory_bank.delete({
                        where: { id: input.id },
                    });
                });            
            }
        ),

        searchFactories: protectedProcedure
            .input(z.object({
                query: z.string().min(1),
                limit: z.number().min(1).default(15),
                offset: z.number().min(0).default(0),            
            })
        ).query(async ({ input, ctx }) => {
            const can_view = ctx.permissions[m.FACTORIES]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: 'FORBIDDEN', 
                    message: 'You do not have permission to view factories.' 
                });
            }

            const factories = await ctx.db.factories.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: 'insensitive' } },
                        { contact_person: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { website: { contains: input.query, mode: 'insensitive' } },
                        { office_address: { contains: input.query, mode: 'insensitive' } },
                        { factory_address: { contains: input.query, mode: 'insensitive' } },
                        { prefix: { contains: input.query, mode: 'insensitive' } },
                    ],
                },
                take: input.limit,
                skip: input.offset,
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    office_address: true,
                    factory_address: true,
                    contact_person: true,
                    email: true,
                    prefix: true,
                    phone_no: true,
                    website: true,
                }
            });

            const total = await ctx.db.factories.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: 'insensitive' } },
                        { contact_person: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { website: { contains: input.query, mode: 'insensitive' } },
                        { office_address: { contains: input.query, mode: 'insensitive' } },
                        { factory_address: { contains: input.query, mode: 'insensitive' } },
                        { prefix: { contains: input.query, mode: 'insensitive' } },
                    ],
                },
            });

            return { factories, total };
        }),


    getAllFactories: protectedProcedure.query(async ({ ctx }) => {
        const factories = await ctx.db.factories.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
            }
        });

        return factories;
    }),

    getFactoryBanks: protectedProcedure
        .input(z.object({
            factory_id: z.number().min(1),
        }))
        .query(async ({ input, ctx }) => {
            const banksObj = await ctx.db.factory_bank.findMany({
                where: { factory_id: input.factory_id },
                select: {
                    id: true,
                    banks: {
                        select: {
                            name: true,
                        }
                    },
                    account_no: true,
                }
            });
            
            const banks = banksObj.map(bank => ({
                id: bank.id,
                name: `${bank?.banks?.name} - ${bank.account_no ? bank.account_no : 'Invalid / No Account No'}`,
            }));
            
            return banks;
        }),

});
