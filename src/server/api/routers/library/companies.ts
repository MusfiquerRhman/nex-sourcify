import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const companiesRouter = createTRPCRouter({
    getCompanies: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMPANIES]?.can_view ?? false;
            
            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view companies." 
                });
            }

            const companiesObj = await ctx.db.companies.findMany({
                take: input.limit,
                skip: input.offset,
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    currencies: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    email: true,
                    phone_no: true,
                    city: true,
                    street: true,
                    zip_code: true,
                },
                orderBy: { added_at: 'desc' },
            });

            const total = await ctx.db.companies.count();

            const companies = companiesObj.map(({countries, currencies, ...company}) => ({
                ...company,
                country_names: countries?.name,
                country_id: countries?.id,
                currency_name: currencies?.name,
                currency_id: currencies?.id
            }));

            return { companies, total };
        }),

    getCompanyById: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMPANIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view companies." 
                });
            }

            const companyObj = await ctx.db.companies.findUnique({
                where: { id: parseInt(input.id) },
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    currencies: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    email: true,
                    phone_no: true,
                    city: true,
                    street: true,
                    zip_code: true,
                },
            });

            const company = companyObj && {
                ...companyObj,
                country_id: companyObj.countries?.id,
                currencies_id: companyObj.currencies?.id,
            };

            const companyBanks = await ctx.db.company_banks.findMany({
                where: { company_id: parseInt(input.id) },
                select: {
                    id: true,
                    bank_id: true,
                    branch_name: true,
                    account_no: true,
                    account_name: true,
                    swift: true,
                    address: true,
                },
            });

            return {company, companyBanks};
        }),


    addCompany: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                country_id: z.number().min(1),
                currency_id: z.number().min(1),
                email: z.string().optional(),
                phone_no: z.string().optional(),
                city: z.string().optional(),
                street: z.string().optional(),
                zip_code: z.string().optional(),
                company_banks: z.array(z.object({
                    bank_id: z.number().min(1),
                    branch_name: z.string().min(2).max(255),
                    account_no: z.string().min(5).max(50),
                    account_name: z.string().min(2).max(255),
                    swift: z.string().max(50).optional(),
                    address: z.string().max(500).optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.COMPANIES]?.can_add ?? false;

            if(!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN",
                    message: "You do not have permission to add companies." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const company = await tx.companies.create({
                        data: {
                            name: input.name.trim(),
                            country_id: input.country_id,
                            currencies_id: input.currency_id,
                            email: input.email,
                            phone_no: input.phone_no,
                            city: input.city,
                            street: input.street,
                            zip_code: input.zip_code,
                        },
                    });

                    await tx.companies_history.create({
                        data: {
                            company_id: company.id,
                            name: company.name.trim(),
                            country_id: company.country_id,
                            currencies_id: company.currencies_id,
                            email: company.email,
                            phone_no: company.phone_no,
                            city: company.city,
                            street: company.street,
                            zip_code: company.zip_code,
                            action_type: 'ADDED',
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.company_banks && input.company_banks.length > 0) {
                        for (const bank of input.company_banks) {
                            const companyBank = await tx.company_banks.create({
                                data: {
                                    company_id: company.id,
                                    bank_id: bank.bank_id,
                                    branch_name: bank.branch_name.trim(),
                                    account_no: bank.account_no.trim(),
                                    account_name: bank.account_name.trim(),
                                    swift: bank.swift?.trim(),
                                    address: bank.address?.trim(),
                                },
                            });

                            await tx.company_banks_history.create({
                                data: {
                                    company_bank_id: companyBank.id,
                                    company_id: company.id,
                                    bank_id: companyBank.bank_id,
                                    branch_name: companyBank.branch_name?.trim(),
                                    account_no: companyBank.account_no?.trim(),
                                    account_name: companyBank.account_name?.trim(),
                                    swift: companyBank.swift?.trim(),
                                    address: companyBank.address?.trim(),
                                    action_type: 'ADDED',
                                    action_by: ctx.user.id,
                                },
                            });
                        }

                    }

                    return company;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    deleteCompany: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.COMPANIES]?.can_delete ?? false;
            

            if(!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete companies." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const companyBanks = await tx.company_banks.findMany({
                        where: { company_id: input.id },
                    });

                    for (const bank of companyBanks) {
                        await tx.company_banks_history.create({
                            data: {
                                company_bank_id: bank.id,
                                company_id: bank.company_id,
                                bank_id: bank.bank_id,
                                branch_name: bank.branch_name,
                                account_no: bank.account_no,
                                account_name: bank.account_name,
                                swift: bank.swift,
                                address: bank.address,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            }
                        });

                        await tx.company_banks.delete({
                            where: { id: bank.id },
                        });
                    }

                    const company = await tx.companies.delete({
                        where: { id: input.id },
                    });

                    if (!company) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Company not found." 
                        });
                    }

                    await tx.companies_history.create({
                        data: {
                            company_id: company.id,
                            name: company.name,
                            country_id: company.country_id,
                            currencies_id: company.currencies_id,
                            email: company.email,
                            phone_no: company.phone_no,
                            city: company.city,
                            street: company.street,
                            zip_code: company.zip_code,
                            action_type: 'DELETE',
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

    updateCompany: protectedProcedure
        .input(
            z.object({
                id: z.number(), 
                name: z.string().min(1),
                country_id: z.number().min(1),
                currencies_id: z.number().min(1),
                email: z.string().optional(),
                phone_no: z.string().optional(),
                city: z.string().optional(),
                street: z.string().optional(),
                zip_code: z.string().optional(),
                company_banks: z.array(z.object({
                    db_id: z.number().optional(),
                    bank_id: z.number().min(1),
                    branch_name: z.string().min(2).max(255),
                    account_no: z.string().min(5).max(50),
                    account_name: z.string().min(2).max(255),
                    swift: z.string().max(50).optional(),
                    address: z.string().max(500).optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.COMPANIES]?.can_update ?? false;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update companies." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.companies_history.create({
                        data: {
                            company_id: input.id,
                            name: input.name,
                            country_id: input.country_id,
                            currencies_id: input.currencies_id,
                            email: input.email,
                            phone_no: input.phone_no,
                            city: input.city,
                            street: input.street,
                            zip_code: input.zip_code,
                            action_type: 'UPDATE',
                            action_by: ctx.user.id,
                        }
                    });
                    
                    const updatedCompany = await tx.companies.update({
                        where: { id: input.id },
                        data: {
                            name: input.name,
                            country_id: input.country_id,
                            currencies_id: input.currencies_id,
                            email: input.email,
                            phone_no: input.phone_no,
                            city: input.city,
                            street: input.street,
                            zip_code: input.zip_code,
                        },
                    });

                    for(const bankInput of input.company_banks ?? []) {
                        if(bankInput.db_id) {
                            const existingBank = await tx.company_banks.findUnique({
                                where: { id: bankInput.db_id },
                            });

                            if(existingBank) {
                                await tx.company_banks_history.create({
                                    data: {
                                        company_bank_id: existingBank.id,
                                        company_id: existingBank.company_id,
                                        bank_id: bankInput.bank_id,
                                        branch_name: bankInput.branch_name,
                                        account_no: bankInput.account_no,
                                        account_name: bankInput.account_name,
                                        swift: bankInput.swift,
                                        address: bankInput.address,
                                        action_type: 'UPDATE',
                                        action_by: ctx.user.id,
                                    }
                                });

                                await tx.company_banks.update({
                                    where: { id: bankInput.db_id },
                                    data: {
                                        bank_id: bankInput.bank_id,
                                        branch_name: bankInput.branch_name,
                                        account_no: bankInput.account_no,
                                        account_name: bankInput.account_name,
                                        swift: bankInput.swift,
                                        address: bankInput.address,
                                    },
                                });
                            }

                        } else {
                            const newBank = await tx.company_banks.create({
                                data: {
                                    company_id: input.id,
                                    bank_id: bankInput.bank_id,
                                    branch_name: bankInput.branch_name,
                                    account_no: bankInput.account_no,
                                    account_name: bankInput.account_name,
                                    swift: bankInput.swift,
                                    address: bankInput.address,
                                },
                            });

                            await tx.company_banks_history.create({
                                data: {
                                    company_bank_id: newBank.id,
                                    company_id: newBank.company_id,
                                    bank_id: newBank.bank_id,
                                    branch_name: newBank.branch_name,
                                    account_no: newBank.account_no,
                                    account_name: newBank.account_name,
                                    swift: newBank.swift,
                                    address: newBank.address,
                                    action_type: 'ADDED',
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    return updatedCompany;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    searchCompanies: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.COMPANIES]?.can_view ?? false;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view companies." 
                });
            }

            const companiesObj = await ctx.db.companies.findMany({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { city: { contains: input.query, mode: 'insensitive' } },
                        { street: { contains: input.query, mode: 'insensitive' } },
                        { zip_code: { contains: input.query, mode: 'insensitive' } },
                        { countries: { name: { contains: input.query, mode: 'insensitive' } } },
                        { currencies: { name: { contains: input.query, mode: 'insensitive' } } },
                    ],
                },
                take: input.limit,
                skip: input.offset,
                select: {
                    id: true,
                    name: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    currencies: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    email: true,
                    phone_no: true,
                    city: true,
                    street: true,
                    zip_code: true,
                },
                orderBy: { added_at: 'desc' },
            });

            const total = await ctx.db.companies.count({
                where: {
                    OR: [
                        { name: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { city: { contains: input.query, mode: 'insensitive' } },
                        { street: { contains: input.query, mode: 'insensitive' } },
                        { zip_code: { contains: input.query, mode: 'insensitive' } },
                        { countries: { name: { contains: input.query, mode: 'insensitive' } } },
                        { currencies: { name: { contains: input.query, mode: 'insensitive' } } },
                    ],
                },
            });

            const companies = companiesObj.map(({countries, currencies, ...company}) => ({
                ...company,
                country_names: countries?.name,
                country_id: countries?.id,
                currency_name: currencies?.name,
                currency_id: currencies?.id,
            }));

            return { companies, total };
        }),

    deleteCompanyBank: protectedProcedure
        .input(
            z.object({
                id: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.COMPANIES]?.can_update ?? false;

            if(!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update companies." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const companyBank = await tx.company_banks.delete({
                        where: { id: input.id },
                    });

                    if (!companyBank) {
                        throw new TRPCError({ 
                            code: "NOT_FOUND", 
                            message: "Company bank not found." 
                        });
                    }

                    await tx.company_banks_history.create({
                        data: {
                            company_bank_id: companyBank.id,
                            company_id: companyBank.company_id,
                            bank_id: companyBank.bank_id,
                            branch_name: companyBank.branch_name,
                            account_no: companyBank.account_no,
                            account_name: companyBank.account_name,
                            swift: companyBank.swift,
                            address: companyBank.address,
                            action_type: 'DELETE',
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

    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.companies.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            });
        }),

    getRdlBanks: protectedProcedure
        .input(
            z.number(),
        )
        .query(async ({ ctx, input }) => {

            const bankObj = await ctx.db.company_banks.findMany({
                where: { company_id: input },
                select: {
                    id: true,
                    banks: {
                        select: {
                            name: true,
                        }
                    },
                    account_no: true,
                },
            });

            const banks = bankObj.map(bank => ({
                id: bank.id,
                name: `${bank?.banks?.name} - ${bank.account_no ? bank.account_no : 'Invalid / No Account No'}`,
            }));
 
            return banks;
        }),
});