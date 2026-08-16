import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

export const buyerRouter = createTRPCRouter({
    getBuyers: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).default(10),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYERS]?.can_view;
            
            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view buyers." 
                });
            }

            const buyersObj = await ctx.db.buyers.findMany({
                skip: input.offset,
                take: input.limit,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    buyer_name: true,
                    short_name: true,
                    prefix: true,
                    address: true,
                    phone_no: true,
                    email: true,
                    contact_person: true,
                    website: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    overseas_offices: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            const total = await ctx.db.buyers.count();

            const buyers = buyersObj.map(({countries, overseas_offices, ...buyer}) => ({
                ...buyer,
                country_name: countries?.name,
                country_id: countries?.id,
                overseas_office_id: overseas_offices?.id,
                overseas_office: overseas_offices?.name,
            }));

            return { buyers, total };
        }),

    getBuyerById: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view buyers." 
                });
            }

            const buyerObj = await ctx.db.buyers.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    buyer_name: true,
                    short_name: true,
                    prefix: true,
                    address: true,
                    phone_no: true,
                    email: true,
                    contact_person: true,
                    website: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    overseas_offices: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    buyer_destinations: {
                        select: {
                            destinations_id: true,
                            destinations: {
                                select: {
                                    name: true,
                                },
                            }
                        },
                    },
                    buyer_payment_term: {
                        select: {
                            payment_term_id: true,
                            payment_terms: {
                                select: {
                                    term_description: true,
                                }
                            },
                        },
                    },
                    buyer_brands: {
                        select: {
                            id: true,
                            brand: true,
                            buyer_departments: {
                                select: {
                                    id: true,
                                    department: true,
                                    buyer_department_sizes: {
                                        select: {
                                            id: true,
                                            size: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });

            const consignee = await ctx.db.buyer_consignee.findMany({
                where: { buyer_id: input.id },
                orderBy: { sl_no: "asc" },
                select: {
                    id: true,
                    sl_no: true,
                    consignee_name: true,
                    address: true,
                }
            });           
            
            const banks =  await ctx.db.buyer_banks.findMany({
                where: { buyer_id: input.id },
                orderBy: { id: "asc" },
                select: {
                    id: true,
                    bank_id: true,
                    branch_name: true,
                    account_no: true,
                    account_name: true,
                    swift: true,
                    address: true,
                }
            });

            const clause = await ctx.db.buyer_additional_clause.findMany({
                where: { buyer_id: input.id },
                orderBy: { sl_no: "asc" },
                select: {
                    id: true,
                    sl_no: true,
                    description: true,
                }
            });

            const latePolicy = await ctx.db.buyer_late_policies.findMany({
                where: { buyer_id: input.id },
                orderBy: { sl_no: "asc" },
                select: {
                    id: true,
                    sl_no: true,
                    description: true,
                }
            });

            const buyer = buyerObj ? {
                ...buyerObj,
                country_name: buyerObj.countries?.name,
                country_id: buyerObj.countries?.id,
                overseas_office_id: buyerObj.overseas_offices?.id,
                overseas_office: buyerObj.overseas_offices?.name,
                destinations: { 
                    label: buyerObj.buyer_destinations.map((bd) => bd.destinations?.name ?? ""), 
                    value: buyerObj.buyer_destinations.map((bd) => bd.destinations_id?.toString() ?? "") 
                },
                payment_terms: {
                    label: buyerObj.buyer_payment_term.map((bpt) => bpt.payment_terms?.term_description ?? ""), 
                    value: buyerObj.buyer_payment_term.map((bpt) => bpt.payment_term_id?.toString() ?? "") 
                },
            } : null;

            return {buyer, consignee, banks, clause, latePolicy};
        }),


    addBuyers: protectedProcedure
        .input(
            z.object({
                buyer_name: z.string().min(1).max(255),
                short_name: z.string().min(1).max(100),
                prefix: z.string().min(1).max(10),
                address: z.string().max(500).optional(),
                phone_no: z.string().max(50).optional(),
                email: z.string().max(255).optional(),
                contact_person: z.string().max(255).optional(),
                website: z.string().max(255).optional(),
                country_id: z.number().optional(),
                overseas_office_id: z.number().optional(),
                paymentTerms: z.array(z.string()).optional(),
                destinations: z.array(z.string()).optional(),
                consignee: z.array(z.object({
                    sl_no: z.number().min(1),
                    consignee_name: z.string().min(1),
                    address: z.string().min(1),
                })).optional(),
                banks: z.array(z.object({
                    bank_id: z.number().min(1),
                    branch_name: z.string().min(1),
                    account_no: z.string().min(1),
                    account_name: z.string().min(1),
                    swift: z.string().min(1),
                    address: z.string().min(1),
                })).optional(),
                clause: z.array(z.object({
                    sl_no: z.number().min(1),
                    description: z.string().min(1),
                })).optional(),
                policy: z.array(z.object({
                    sl_no: z.number().min(1),
                    description: z.string().min(1),
                })).optional(),
                buyer_brands: z.array(z.object({
                    brand: z.string().min(1),
                    buyer_departments: z.array(z.object({
                        department: z.string().min(1),
                        buyer_department_sizes: z.array(z.object({
                            size: z.string().min(1),
                        })).optional(),
                    })).optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_add = ctx.permissions[m.BUYERS]?.can_add;

            if (!can_add) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to add buyers." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const buyer = await tx.buyers.create({
                        data: {
                            buyer_name: input.buyer_name.trim(),
                            short_name: input.short_name.trim(),
                            prefix: input.prefix.trim(),
                            address: input.address?.trim(),
                            phone_no: input.phone_no,
                            email: input.email,
                            contact_person: input.contact_person,
                            website: input.website,
                            country_id: input.country_id,
                            overseas_office_id: input.overseas_office_id,
                        },
                    });

                    await tx.buyers_history.create({
                        data: {
                            buyers_id: buyer.id,
                            buyer_name: input.buyer_name.trim(),
                            short_name: input.short_name.trim(),
                            prefix: input.prefix.trim(),
                            address: input.address?.trim(),
                            phone_no: input.phone_no,
                            email: input.email,
                            contact_person: input.contact_person,
                            website: input.website,
                            country_id: input.country_id,
                            overseas_office_id: input.overseas_office_id,
                            action_type: 'ADDED',
                            action_by: ctx.user.id,
                        },
                    });

                    if(input.paymentTerms && input.paymentTerms.length > 0) {
                        for (const termId of input.paymentTerms) {
                            const buyerPaymentTerm = await tx.buyer_payment_term.create({
                                data: {
                                    buyer_id: buyer.id,
                                    payment_term_id: parseInt(termId),
                                },
                            });

                            await tx.buyer_payment_term_history.create({
                                data: {
                                    buyer_id: buyer.id,
                                    buyer_payment_term_id: buyerPaymentTerm.id,
                                    payment_term_id: parseInt(termId),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.destinations && input.destinations.length > 0) {
                        for (const destId of input.destinations) { // no need to over engineer here
                            const buyerDestination = await tx.buyer_destinations.create({
                                data: {
                                    buyer_id: buyer.id,
                                    destinations_id: parseInt(destId),
                                },
                            });

                            await tx.buyer_destinations_history.create({
                                data: {
                                    buyer_id: buyerDestination.buyer_id,
                                    buyer_destinations_id: buyerDestination.id,
                                    destinations_id: buyerDestination.destinations_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.consignee && input.consignee.length > 0){
                        for (const consignee of input.consignee) {
                            const createdConsignee =  await tx.buyer_consignee.create({
                                data: {
                                    buyer_id: buyer.id,
                                    sl_no: consignee.sl_no,
                                    consignee_name: consignee.consignee_name.trim(),
                                    address: consignee.address?.trim(),
                                },
                            });

                            await tx.buyer_consignee_history.create({
                                data: {
                                    buyer_consignee_id: createdConsignee.id,
                                    buyer_id: createdConsignee.buyer_id,
                                    sl_no: createdConsignee.sl_no,
                                    consignee_name: createdConsignee.consignee_name.trim(),
                                    address: createdConsignee.address?.trim(),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.banks && input.banks.length > 0){
                        for (const bank of input.banks) {
                            const createdBank = await tx.buyer_banks.create({
                                data: {
                                    buyer_id: buyer.id,
                                    bank_id: bank.bank_id,
                                    branch_name: bank.branch_name.trim(),
                                    account_no: bank.account_no,
                                    account_name: bank.account_name.trim(),
                                    swift: bank.swift,
                                    address: bank.address?.trim(),
                                },
                            });

                            await tx.buyer_banks_history.create({
                                data: {
                                    buyer_banks_id: createdBank.id,
                                    buyer_id: createdBank.buyer_id,
                                    bank_id: createdBank.bank_id,
                                    branch_name: createdBank.branch_name,
                                    account_no: createdBank.account_no,
                                    account_name: createdBank.account_name,
                                    swift: createdBank.swift,
                                    address: createdBank.address,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.clause && input.clause.length > 0){
                        for (const clause of input.clause) {
                            const createdClause = await tx.buyer_additional_clause.create({
                                data: {
                                    buyer_id: buyer.id,
                                    sl_no: clause.sl_no,
                                    description: clause.description.trim(),
                                },
                            });

                            await tx.buyer_additional_clause_history.create({
                                data: {
                                    buyer_additional_clause_id: createdClause.id,
                                    buyer_id: createdClause.buyer_id,
                                    sl_no: createdClause.sl_no,
                                    description: createdClause.description,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.policy && input.policy.length > 0){
                        for (const policy of input.policy) {
                            const createdPolicy = await tx.buyer_late_policies.create({
                                data: {
                                    buyer_id: buyer.id,
                                    sl_no: policy.sl_no,
                                    description: policy.description,
                                },
                            });

                            await tx.buyer_late_policies_history.create({
                                data: {
                                    buyer_late_policies_id: createdPolicy.id,
                                    buyer_id: createdPolicy.buyer_id,
                                    sl_no: createdPolicy.sl_no,
                                    description: createdPolicy.description.trim(),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.buyer_brands && input.buyer_brands.length > 0){
                        for (const brand of input.buyer_brands) {
                            const createdBrand = await tx.buyer_brands.create({
                                data: {
                                    buyer_id: buyer.id,
                                    brand: brand.brand.trim(),
                                },
                            });

                            await tx.buyer_brands_history.create({
                                data: {
                                    buyer_brand_id: createdBrand.id,
                                    buyer_id: createdBrand.buyer_id,
                                    brand: createdBrand.brand.trim(),
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });

                            if(brand.buyer_departments && brand.buyer_departments.length > 0){
                                for (const department of brand.buyer_departments) {
                                    const createdDepartment = await tx.buyer_departments.create({
                                        data: {
                                            buyer_brand_id: createdBrand.id,
                                            department: department.department.trim(),
                                        },
                                    });

                                    await tx.buyer_departments_history.create({
                                        data: {
                                            buyer_department_id: createdDepartment.id,
                                            buyer_brand_id: createdDepartment.buyer_brand_id,
                                            department: createdDepartment.department.trim(),
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                        },
                                    });

                                    if(department.buyer_department_sizes && department.buyer_department_sizes.length > 0){
                                        for (const size of department.buyer_department_sizes) {
                                            await tx.buyer_department_sizes.create({
                                                data: {
                                                    buyer_department_id: createdDepartment.id,
                                                    size: size.size.trim(),
                                                },
                                            });

                                            await tx.buyer_department_sizes_history.create({
                                                data: {
                                                    buyer_department_sizes_id: createdDepartment.id,
                                                    buyer_department_id: createdDepartment.buyer_brand_id,
                                                    size: size.size.trim(),
                                                    action_type: 'ADDED',
                                                    action_by: ctx.user.id
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                
                return buyer;
            });
        }
        catch (error) {
            await logError(error, ctx, input);
            handlePrismaError(error);
        }
    }),

    deleteBuyer: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete buyers." 
                });
            }

            // Delete buyer and all related records in a transaction
            try {
                return await ctx.db.$transaction(async (tx) => {
                // fetch everything for history 
                    const [ 
                        banks, paymentTerms, destinations, consignees, clauses, latePolicies, buyerBrands, buyerDepartments, buyerDepartmentSizes
                    ] = await Promise.all([
                        tx.buyer_banks.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_payment_term.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_destinations.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_consignee.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_additional_clause.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_late_policies.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_brands.findMany({ where: { buyer_id: input.id } }),
                        tx.buyer_departments.findMany({ where: { buyer_brands: { buyer_id: input.id } } }),
                        tx.buyer_department_sizes.findMany({ where: { buyer_departments: { buyer_brands: { buyer_id: input.id } } } }),
                    ]);

                    // write history
                    await Promise.all([
                        banks.length && tx.buyer_banks_history.createMany({
                            data: banks.map(b => ({
                                buyer_id: b.buyer_id,
                                bank_id: b.bank_id,
                                branch_name: b.branch_name,
                                account_no: b.account_no,
                                account_name: b.account_name,
                                swift: b.swift,
                                address: b.address,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        paymentTerms.length && tx.buyer_payment_term_history.createMany({
                            data: paymentTerms.map(p => ({
                                buyer_id: p.buyer_id,
                                payment_term_id: p.payment_term_id,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        destinations.length && tx.buyer_destinations_history.createMany({
                            data: destinations.map(d => ({
                                buyer_id: d.buyer_id,
                                destinations_id: d.destinations_id,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        consignees.length && tx.buyer_consignee_history.createMany({
                            data: consignees.map(c => ({
                                buyer_id: c.buyer_id,
                                sl_no: c.sl_no,
                                consignee_name: c.consignee_name,
                                address: c.address,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        clauses.length && tx.buyer_additional_clause_history.createMany({
                            data: clauses.map(c => ({
                                buyer_id: c.buyer_id,
                                sl_no: c.sl_no,
                                description: c.description,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        latePolicies.length && tx.buyer_late_policies_history.createMany({
                            data: latePolicies.map(p => ({
                                buyer_id: p.buyer_id,
                                sl_no: p.sl_no,
                                description: p.description,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        buyerDepartmentSizes.length && tx.buyer_department_sizes_history.createMany({
                            data: buyerDepartmentSizes.map(s => ({
                                buyer_department_id: s.buyer_department_id,
                                size: s.size,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        buyerDepartments.length && tx.buyer_departments_history.createMany({
                            data: buyerDepartments.map(d => ({
                                buyer_brand_id: d.buyer_brand_id,
                                department: d.department,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),

                        buyerBrands.length && tx.buyer_brands_history.createMany({
                            data: buyerBrands.map(b => ({
                                buyer_id: b.buyer_id,
                                brand: b.brand,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            })),
                        }),
                    ]);

                    // delete all the child records
                    await Promise.all([
                        tx.buyer_banks.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_payment_term.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_destinations.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_consignee.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_additional_clause.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_late_policies.deleteMany({ where: { buyer_id: input.id } }),
                        tx.buyer_department_sizes.deleteMany({ where: { buyer_departments: { buyer_brands: { buyer_id: input.id } } } }),
                        tx.buyer_departments.deleteMany({ where: { buyer_brands: { buyer_id: input.id } } }),
                        tx.buyer_brands.deleteMany({ where: { buyer_id: input.id } }),
                    ]);

                    // finally delete the buyer
                    const buyer = await tx.buyers.delete({
                        where: { id: input.id },
                    });

                    // write buyer delete history
                    await tx.buyers_history.create({
                        data: {
                            buyers_id: buyer.id,
                            buyer_name: buyer.buyer_name,
                            short_name: buyer.short_name,
                            prefix: buyer.prefix,
                            address: buyer.address,
                            phone_no: buyer.phone_no,
                            email: buyer.email,
                            contact_person: buyer.contact_person,
                            website: buyer.website,
                            country_id: buyer.country_id,
                            overseas_office_id: buyer.overseas_office_id,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });

                    return buyer;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    updateBuyer: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
                buyer_name: z.string().min(1).max(255),
                short_name: z.string().min(1).max(100),
                prefix: z.string().min(1).max(10),
                address: z.string().max(500).optional(),
                phone_no: z.string().max(50).optional(),
                email: z.string().max(255).optional(),
                contact_person: z.string().max(255).optional(),
                website: z.string().max(255).optional(),
                country_id: z.number().optional(),
                overseas_office_id: z.number().optional(),
                paymentTerms: z.array(z.string()).optional(),
                destinations: z.array(z.string()).optional(),
                consignee: z.array(z.object({
                    db_id: z.number().min(1).optional(),
                    sl_no: z.number().min(1),
                    consignee_name: z.string().min(1),
                    address: z.string().min(1),
                })).optional(),
                banks: z.array(z.object({
                    db_id: z.number().min(1).optional(),
                    bank_id: z.number().min(1),
                    branch_name: z.string().min(1),
                    account_no: z.string().min(1),
                    account_name: z.string().min(1),
                    swift: z.string().min(1),
                    address: z.string().min(1),
                })).optional(),
                clause: z.array(z.object({
                    db_id: z.number().min(1).optional(),
                    sl_no: z.number().min(1),
                    description: z.string().min(1),
                })).optional(),
                policy: z.array(z.object({
                    db_id: z.number().min(1).optional(),
                    sl_no: z.number().min(1),
                    description: z.string().min(1),
                })).optional(),
                buyer_brands: z.array(z.object({
                    id: z.number().min(1).optional(),
                    brand: z.string().min(1),
                    buyer_departments: z.array(z.object({
                        department: z.string().min(1),
                        id: z.number().min(1).optional(),
                        buyer_department_sizes: z.array(z.object({
                            id: z.number().min(1).optional(),
                            size: z.string().min(1),
                        })).optional(),
                    })).optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_update = ctx.permissions[m.BUYERS]?.can_update;

            if (!can_update) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to update buyers." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    await tx.buyers_history.create({
                        data: {
                            buyers_id: input.id,
                            buyer_name: input.buyer_name.trim(),
                            short_name: input.short_name.trim(),
                            prefix: input.prefix.trim(),
                            address: input.address?.trim(),
                            phone_no: input.phone_no?.trim(),
                            email: input.email?.trim(),
                            contact_person: input.contact_person,
                            website: input.website,
                            country_id: input.country_id,
                            overseas_office_id: input.overseas_office_id,
                            action_type: 'UPDATE',
                            action_by: ctx.user.id,
                        },
                    });

                    const buyer = await tx.buyers.update({
                        where: { id: input.id },
                        data: {
                            buyer_name: input.buyer_name.trim(),
                            short_name: input.short_name.trim(),
                            prefix: input.prefix.trim(),
                            address: input.address?.trim(),
                            phone_no: input.phone_no?.trim(),
                            email: input.email?.trim(),
                            contact_person: input.contact_person,
                            website: input.website,
                            country_id: input.country_id,
                            overseas_office_id: input.overseas_office_id,
                        },
                    });

                    if (input.paymentTerms && input.paymentTerms.length > 0) {
                        const incomingIds = input.paymentTerms.map(id => parseInt(id));

                        const existing = await tx.buyer_payment_term.findMany({
                            where: { buyer_id: input.id },
                            select: { id: true, payment_term_id: true },
                        });

                        const existingIds = existing.map(e => e.payment_term_id);

                        // New terms to add
                        const toAdd = incomingIds.filter(id => !existingIds.includes(id));

                        // Terms to delete
                        const toDelete = existing.filter(e => !incomingIds.includes(e.payment_term_id ?? -1));

                        // Delete removed ones
                        for (const term of toDelete) {
                            await tx.buyer_payment_term.delete({
                                where: { id: term.id },
                            });

                            await tx.buyer_payment_term_history.create({
                                data: {
                                    buyer_id: input.id,
                                    buyer_payment_term_id: term.id,
                                    payment_term_id: term.payment_term_id,
                                    action_type: actions.DELETE,
                                    action_by: ctx.user.id,
                                },
                            });
                        }

                        // Add new ones
                        for (const termId of toAdd) {
                            const created = await tx.buyer_payment_term.create({
                                data: {
                                    buyer_id: input.id,
                                    payment_term_id: termId,
                                },
                            });

                            await tx.buyer_payment_term_history.create({
                                data: {
                                    buyer_id: input.id,
                                    buyer_payment_term_id: created.id,
                                    payment_term_id: termId,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                if (input.destinations && input.destinations.length > 0) {
                        const incomingIds = input.destinations.map(id => parseInt(id));

                        const existing = await tx.buyer_destinations.findMany({
                            where: { buyer_id: input.id },
                            select: { id: true, destinations_id: true },
                        });

                        const existingIds = existing.map(e => e.destinations_id);

                        // New destinations
                        const toAdd = incomingIds.filter(id => !existingIds.includes(id));

                        // Removed destinations
                        const toDelete = existing.filter(e => !incomingIds.includes(e.destinations_id ?? -1));

                        // Delete removed
                        for (const dest of toDelete) {
                            await tx.buyer_destinations.delete({
                                where: { id: dest.id },
                            });

                            await tx.buyer_destinations_history.create({
                                data: {
                                    buyer_id: input.id,
                                    buyer_destinations_id: dest.id,
                                    destinations_id: dest.destinations_id,
                                    action_type: actions.DELETE,
                                    action_by: ctx.user.id,
                                },
                            });
                        }

                        // Add new
                        for (const destId of toAdd) {
                            const created = await tx.buyer_destinations.create({
                                data: {
                                    buyer_id: input.id,
                                    destinations_id: destId,
                                },
                            });

                            await tx.buyer_destinations_history.create({
                                data: {
                                    buyer_id: input.id,
                                    buyer_destinations_id: created.id,
                                    destinations_id: destId,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    }

                    if(input.consignee && input.consignee.length > 0){
                        for (const consignee of input.consignee) {
                            let buyerConsignee;

                            if (!!consignee.db_id) {
                                buyerConsignee = await tx.buyer_consignee.update({
                                    where: { id: consignee.db_id },
                                    data: {
                                        sl_no: consignee.sl_no,
                                        consignee_name: consignee.consignee_name.trim(),
                                        address: consignee.address.trim(),
                                    },
                                });
                            } else {
                                buyerConsignee = await tx.buyer_consignee.create({
                                    data: {
                                        buyer_id: input.id,
                                        sl_no: consignee.sl_no,
                                        consignee_name: consignee.consignee_name.trim(),
                                        address: consignee.address.trim(),
                                    },
                                });
                            }

                            await tx.buyer_consignee_history.create({
                                data: {
                                    buyer_consignee_id: buyerConsignee.id,
                                    buyer_id: buyerConsignee.buyer_id,
                                    sl_no: buyerConsignee.sl_no,
                                    consignee_name: buyerConsignee.consignee_name.trim(),
                                    address: buyerConsignee.address.trim(),
                                    action_type: consignee.db_id ? "UPDATE" : "ADDED",
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    };

                    if(input.banks && input.banks.length > 0){
                        for (const bank of input.banks) {
                            let buyerBank;

                            if (!!bank.db_id) {
                                // UPDATE
                                buyerBank = await tx.buyer_banks.update({
                                    where: { id: bank.db_id },
                                    data: {
                                        bank_id: bank.bank_id,
                                        branch_name: bank.branch_name.trim(),
                                        account_name: bank.account_name.trim(),
                                        account_no: bank.account_no,
                                        swift: bank.swift,
                                        address: bank.address.trim(),
                                    },
                                });
                            } else {
                                // CREATE
                                buyerBank = await tx.buyer_banks.create({
                                    data: {
                                        buyer_id: input.id,
                                        bank_id: bank.bank_id,
                                        branch_name: bank.branch_name.trim(),
                                        account_name: bank.account_name.trim(),
                                        account_no: bank.account_no,
                                        swift: bank.swift,
                                        address: bank.address.trim(),
                                    },
                                });
                            }
                            await tx.buyer_banks_history.create({
                                data: {
                                    buyer_banks_id: buyerBank.id,
                                    buyer_id: buyerBank.buyer_id,
                                    bank_id: buyerBank.bank_id,
                                    branch_name: buyerBank.branch_name,
                                    account_no: buyerBank.account_no,
                                    account_name: buyerBank.account_name,
                                    swift: buyerBank.swift,
                                    address: buyerBank.address,
                                    action_type: bank.db_id ? "UPDATE" : "ADDED",
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    };

                    if(input.clause && input.clause.length > 0){
                        for (const clause of input.clause) {
                            let buyerClause;

                            if (!!clause.db_id) {
                                // UPDATE
                                buyerClause = await tx.buyer_additional_clause.update({
                                    where: { id: clause.db_id },
                                    data: {
                                        sl_no: clause.sl_no,
                                        description: clause.description.trim(),
                                    },
                                });
                            } else {
                                // CREATE
                                buyerClause = await tx.buyer_additional_clause.create({
                                    data: {
                                        buyer_id: input.id,
                                        sl_no: clause.sl_no,
                                        description: clause.description.trim(),
                                    },
                                });
                            }
                            await tx.buyer_additional_clause_history.create({
                                data: {
                                    buyer_additional_clause_id: buyerClause.id,
                                    buyer_id: buyerClause.buyer_id,
                                    sl_no: buyerClause.sl_no,
                                    description: buyerClause.description.trim(),
                                    action_type: clause.db_id ? "UPDATE" : "ADDED",
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    };

                    if(input.policy && input.policy.length > 0){
                        for ( const policy of input.policy) {
                            const isUpdate = !!policy.db_id;

                            const buyerPolicy = isUpdate
                                ? await tx.buyer_late_policies.update({
                                    where: { id: policy.db_id },
                                    data: {
                                        sl_no: policy.sl_no,
                                        description: policy.description.trim(),
                                    },
                                })
                                : await tx.buyer_late_policies.create({
                                    data: {
                                        buyer_id: input.id,
                                        sl_no: policy.sl_no,
                                        description: policy.description.trim(),
                                    },
                                });

                            await tx.buyer_late_policies_history.create({
                                data: {
                                    buyer_late_policies_id: buyerPolicy.id,
                                    buyer_id: buyerPolicy.buyer_id,
                                    sl_no: buyerPolicy.sl_no,
                                    description: buyerPolicy.description.trim(),
                                    action_type: isUpdate ? "UPDATE" : "ADDED",
                                    action_by: ctx.user.id,
                                },
                            });
                        }
                    };

                    if(input.buyer_brands && input.buyer_brands.length > 0){
                        for (const brand of input.buyer_brands) {
                            let brandId = brand.id;
                            if(!brand.id){
                                const createdBrand = await tx.buyer_brands.create({
                                    data: {
                                        buyer_id: input.id,
                                        brand: brand.brand.trim(),
                                    },
                                });
    
                                await tx.buyer_brands_history.create({
                                    data: {
                                        buyer_brand_id: createdBrand.id,
                                        buyer_id: createdBrand.buyer_id,
                                        brand: createdBrand.brand.trim(),
                                        action_type: actions.ADDED,
                                        action_by: ctx.user.id,
                                    },
                                });

                                brandId = createdBrand.id;
                            }


                            if(brand.buyer_departments && brand.buyer_departments.length > 0){
                                for (const department of brand.buyer_departments) {
                                    let departmentId = department.id;
                                    if(!department.id) { // skip existing departments
                                         const createdDepartment = await tx.buyer_departments.create({
                                            data: {
                                                buyer_brand_id: brandId,
                                                department: department.department.trim(),
                                            },
                                        });

                                        await tx.buyer_departments_history.create({
                                            data: {
                                                buyer_department_id: createdDepartment.id,
                                                buyer_brand_id: createdDepartment.buyer_brand_id,
                                                department: createdDepartment.department.trim(),
                                                action_type: actions.ADDED,
                                                action_by: ctx.user.id,
                                            },
                                        });

                                        departmentId = createdDepartment.id;
                                    } 

                                    if(department.buyer_department_sizes && department.buyer_department_sizes.length > 0){
                                        for (const size of department.buyer_department_sizes) {
                                            if(size?.id) continue; // skip existing sizes
                                            
                                            const createdSize = await tx.buyer_department_sizes.create({
                                                data: {
                                                    buyer_department_id: departmentId,
                                                    size: size.size,
                                                },
                                            });

                                            await tx.buyer_department_sizes_history.create({
                                                data: {
                                                    buyer_department_sizes_id: createdSize.id,
                                                    buyer_department_id: departmentId,
                                                    size: size.size.trim(),
                                                    action_type: 'ADDED',
                                                    action_by: ctx.user.id
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return buyer;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),


    searchBuyers: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).default(10),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.BUYERS]?.can_view;

            if (!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view buyers." 
                });
            }

            const buyersObj = await ctx.db.buyers.findMany({
                where: {
                    OR: [
                        { buyer_name: { contains: input.query, mode: 'insensitive' } },
                        { short_name: { contains: input.query, mode: 'insensitive' } },
                        { prefix: { contains: input.query, mode: 'insensitive' } },
                        { address: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { contact_person: { contains: input.query, mode: 'insensitive' } },
                        { website: { contains: input.query, mode: 'insensitive' } },
                        {
                            countries: {
                                name: { contains: input.query, mode: 'insensitive' }
                            }
                        },
                        {
                            overseas_offices: {
                                name: { contains: input.query, mode: 'insensitive' }
                            }
                        },
                        {
                            buyer_brands: {
                                some: {
                                    brand: { contains: input.query, mode: 'insensitive' },
                                    buyer_departments: {
                                        some: {
                                            department: { contains: input.query, mode: 'insensitive' },
                                            buyer_department_sizes: {
                                                some: {
                                                    size: { contains: input.query, mode: 'insensitive' },
                                                }
                                            }
                                        }
                                    }
                                },
                            }
                        },
                    ],
                },
                skip: input.offset,
                take: input.limit,
                orderBy: { added_at: "desc" },
                select: {
                    id: true,
                    buyer_name: true,
                    short_name: true,
                    prefix: true,
                    address: true,
                    phone_no: true,
                    email: true,
                    contact_person: true,
                    website: true,
                    countries: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    overseas_offices: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            const total = await ctx.db.buyers.count({
                where: {
                    OR: [
                        { buyer_name: { contains: input.query, mode: 'insensitive' } },
                        { short_name: { contains: input.query, mode: 'insensitive' } },
                        { prefix: { contains: input.query, mode: 'insensitive' } },
                        { address: { contains: input.query, mode: 'insensitive' } },
                        { phone_no: { contains: input.query, mode: 'insensitive' } },
                        { email: { contains: input.query, mode: 'insensitive' } },
                        { contact_person: { contains: input.query, mode: 'insensitive' } },
                        { website: { contains: input.query, mode: 'insensitive' } },
                        {
                            countries: {
                                name: { contains: input.query, mode: 'insensitive' }
                            }
                        },
                        {
                            overseas_offices: {
                                name: { contains: input.query, mode: 'insensitive' }
                            }
                        },
                        {
                            buyer_brands: {
                                some: {
                                    brand: { contains: input.query, mode: 'insensitive' },
                                    buyer_departments: {
                                        some: {
                                            department: { contains: input.query, mode: 'insensitive' },
                                            buyer_department_sizes: {
                                                some: {
                                                    size: { contains: input.query, mode: 'insensitive' },
                                                }
                                            }
                                        }
                                    }
                                },
                            }
                        },
                    ],
                },
            });

            const buyers = buyersObj.map(({countries, overseas_offices, ...buyer}) => ({
                ...buyer,
                country_name: countries?.name,
                country_id: countries?.id,
                overseas_office_id: overseas_offices?.id,
                overseas_office: overseas_offices?.name,
            }));

            return { buyers, total };
        }),

    deleteConsignee: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete consignee." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const consignee = await tx.buyer_consignee.delete({ where: { id: input.id } });

                    await tx.buyer_consignee_history.create({
                        data: {
                            buyer_consignee_id: consignee.id,
                            buyer_id: consignee.buyer_id,
                            sl_no: consignee.sl_no,
                            consignee_name: consignee.consignee_name,
                            address: consignee.address,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });

                    return consignee;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteBank: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete bank." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const bank = await tx.buyer_banks.delete({ where: { id: input.id } });

                    await tx.buyer_banks_history.create({
                        data: {
                            buyer_banks_id: bank.id,
                            buyer_id: bank.buyer_id,
                            bank_id: bank.bank_id,
                            branch_name: bank.branch_name,
                            account_no: bank.account_no,
                            account_name: bank.account_name,
                            swift: bank.swift,
                            address: bank.address,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return bank;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteClause: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete clause." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const clause = await tx.buyer_additional_clause.delete({ where: { id: input.id } });

                    await tx.buyer_additional_clause_history.create({
                        data: {
                            buyer_additional_clause_id: clause.id,
                            buyer_id: clause.buyer_id,
                            sl_no: clause.sl_no,
                            description: clause.description,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return clause;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteLatePolicy: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete late policy." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const policy = await tx.buyer_late_policies.delete({ where: { id: input.id } });

                    await tx.buyer_late_policies_history.create({
                        data: {
                            buyer_late_policies_id: policy.id,
                            buyer_id: policy.buyer_id,
                            sl_no: policy.sl_no,
                            description: policy.description,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return policy;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteBrands: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete buyer brand." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const sizes = await tx.buyer_department_sizes.findMany({
                        where: {
                            buyer_departments: {
                                buyer_brand_id: input.id,
                            },
                        },
                    });

                    for(const size of sizes) {
                        await tx.buyer_department_sizes_history.create({
                            data: {
                                buyer_department_sizes_id: size.id,
                                buyer_department_id: size.buyer_department_id,
                                size: size.size,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await tx.buyer_department_sizes.deleteMany({
                        where: {
                            buyer_departments: {
                                buyer_brand_id: input.id,
                            },
                        },
                    });

                    const departments = await tx.buyer_departments.findMany({
                        where: {
                            buyer_brand_id: input.id,
                        },
                    });

                    for(const department of departments) {
                        await tx.buyer_departments_history.create({
                            data: {
                                buyer_department_id: department.id,
                                buyer_brand_id: department.buyer_brand_id,
                                department: department.department,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            },
                        });
                    }
                    await tx.buyer_departments.deleteMany({
                        where: {
                            buyer_brand_id: input.id,
                        },
                    });

                    const brand = await tx.buyer_brands.delete({ where: { id: input.id } });

                    await tx.buyer_brands_history.create({
                        data: {
                            buyer_brand_id: brand.id,
                            buyer_id: brand.buyer_id,
                            brand: brand.brand,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return brand;

                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteDepartment: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;

            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete buyer department." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const sizes = await tx.buyer_department_sizes.findMany({ 
                        where: { buyer_department_id: input.id } 
                    });

                    for(const size of sizes) {
                        await tx.buyer_department_sizes_history.create({
                            data: {
                                buyer_department_sizes_id: size.id,
                                buyer_department_id: size.buyer_department_id,
                                size: size.size,
                                action_type: 'DELETE',
                                action_by: ctx.user.id,
                            },
                        });
                    }

                    await tx.buyer_department_sizes.deleteMany({ 
                        where: { buyer_department_id: input.id } 
                    });

                    const department = await tx.buyer_departments.delete({ where: { id: input.id } });
                    await tx.buyer_departments_history.create({
                        data: {
                            buyer_department_id: department.id,
                            buyer_brand_id: department.buyer_brand_id,
                            department: department.department,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return department;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    deleteSizeSet: protectedProcedure
        .input(
            z.object({
                id: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const can_delete = ctx.permissions[m.BUYERS]?.can_delete;
            if (!can_delete) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to delete buyer department size." 
                });
            }

            try {
                return await ctx.db.$transaction(async (tx) => {
                    const sizeSet = await tx.buyer_department_sizes.delete({ where: { id: input.id } });
                    await tx.buyer_department_sizes_history.create({
                        data: {
                            buyer_department_sizes_id: sizeSet.id,
                            buyer_department_id: sizeSet.buyer_department_id,
                            size: sizeSet.size,
                            action_type: 'DELETE',
                            action_by: ctx.user.id,
                        },
                    });
                    return sizeSet;
                });
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.buyers.findMany({
                orderBy: { buyer_name: 'asc' },
                select: {
                    id: true,
                    buyer_name: true,
                }
            });
        }),

    getAllBuyersByTeam: protectedProcedure
        .query(async ({ ctx }) => {
            try {
                return await ctx.db.$queryRaw<{ id: number; buyer_name: string }[]>`
                    SELECT B.ID, B.BUYER_NAME FROM BUYERS AS B
                        INNER JOIN TEAMS AS T ON T.buyer_id = B.id
                    WHERE (
                        EXISTS (
                            SELECT 1
                            FROM USERS U
                            WHERE U.ID = ${ctx.user.id}
                            AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                            AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM TEAM_MEMBERS TM
                            WHERE TM.TEAM_ID = T.ID
                            AND TM.USER_ID = ${ctx.user.id}
                        )
                    )
                    GROUP BY B.ID, B.BUYER_NAME
                    ORDER BY B.BUYER_NAME ASC;
                `;
            }
            catch (error) {
                            handlePrismaError(error);
            }
        }),

    getBrandsByBuyer: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const brands = await ctx.db.buyer_brands.findMany({
                where: { buyer_id: input },
                orderBy: { brand: 'asc' },
                select: { id: true, brand: true }
            })

            return brands;
        }),

    getDepartmentsByBrand: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const departments = await ctx.db.buyer_departments.findMany({
                where: { buyer_brand_id: input },
                orderBy: { department: 'asc' },
                select: { id: true, department: true }
            })

            return departments;
        }),
 
    getBuyerPaymentTerms: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const paymentTermsObj = await ctx.db.buyer_payment_term.findMany({
                where: { buyer_id: input },
                select: { 
                    id: true, 
                    payment_terms: {
                        select: { 
                            id: true,
                            term_description: true,
                            tenor: true,
                            terms: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                 }
            });

            const paymentTerms = paymentTermsObj.map(pt => ({
                id: pt?.payment_terms?.id,
                term_description: `${pt?.payment_terms?.terms?.name} - ${pt?.payment_terms?.tenor} ${pt?.payment_terms?.term_description}`
            }));

            return paymentTerms;
        }),

    getSizeByDepartment: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const sizes = await ctx.db.buyer_department_sizes.findMany({
                where: { buyer_department_id: input },
                orderBy: { size: 'asc' },
                select: { id: true, size: true }
            })
            return sizes;
        }),

    getBuyerDestinations: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const destinationsObj = await ctx.db.buyer_destinations.findMany({
                where: { buyer_id: input },
                select: { 
                    destinations: { 
                        select: { 
                            id: true,
                            name: true
                        } 
                    } 
                }
            });

            const destinations = destinationsObj.map(dest => ({
                id: dest?.destinations?.id,
                name: dest?.destinations?.name
            }));

            return destinations;
        }),

    getBuyerBanks: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            const banksObj = await ctx.db.buyer_banks.findMany({
                where: { buyer_id: input },
                select: { 
                    id: true,
                    account_no: true,
                    banks: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                }
            });

            const banks = banksObj.map(bank => ({
                id: bank.id,
                name: `${bank?.banks?.name} - ${bank.account_no ? bank.account_no : 'Invalid / No Account No'}`,
            }));

            return banks;
        }),

    getBuyerConsignees: protectedProcedure
        .input(
            z.number().min(1)
        )
        .query(async ({ ctx, input }) => {
            return await ctx.db.buyer_consignee.findMany({
                where: { buyer_id: input },
                orderBy: { sl_no: 'asc' },
                select: { id: true, consignee_name: true }
            });
        }),

    getBrandsByBuyers: protectedProcedure
        .input(
            z.array(z.number()).min(1, "At least one buyer ID is required")
        )
        .query(async ({ ctx, input }) => {
            try {
                return await ctx.db.buyer_brands.findMany({
                    where: {
                        buyer_id: { in: input }
                    },
                    select: {
                        id: true,
                        brand: true,
                    }
                })
            }
            catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        }),

    getDepartmentsByBrands: protectedProcedure
        .input(
            z.array(z.number()).min(1, "At least one brand ID is required")
        )
        .query(async ({ ctx, input }) => {
            try {
                const hasAll = input.includes(-1);
                const brandIds = input.filter(id => id > 0);

                return await ctx.db.$queryRaw<{ id: number; departments: string }[]>(
                    hasAll ? Prisma.sql`
                        SELECT DISTINCT
                            BD.ID,
                            STRING_AGG(
                                REGEXP_REPLACE(BD.department, E'[\\r\\n]+', '', 'g')
                                || ' ('
                                || REGEXP_REPLACE(BB.brand, E'[\\r\\n]+', '', 'g')
                                || ')',
                                ', '
                            ) AS departments
                        FROM BUYERS AS B
                            INNER JOIN buyer_brands AS BB ON BB.buyer_id = B.id
                            INNER JOIN buyer_departments AS BD ON BD.buyer_brand_id = BB.id
                        GROUP BY BD.ID;
                        `
                    : Prisma.sql`
                        SELECT DISTINCT
                            BD.ID,
                            STRING_AGG(
                                REGEXP_REPLACE(BD.department, E'[\\r\\n]+', '', 'g')
                                || ' ('
                                || REGEXP_REPLACE(BB.brand, E'[\\r\\n]+', '', 'g')
                                || ')',
                                ', '
                            ) AS departments
                        FROM BUYERS AS B
                            INNER JOIN buyer_brands AS BB ON BB.buyer_id = B.id
                            INNER JOIN buyer_departments AS BD ON BD.buyer_brand_id = BB.id
                        WHERE BB.ID IN (${Prisma.join(brandIds)})
                        GROUP BY BD.ID;
                        `
                );
            } catch (error) {
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
    }),

});
