import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

interface PropsType {
    buyer_id?: number;
    factory_id?: number;
    company_id?: number;
    isEdit?: boolean;
}

export const formFields = ({buyer_id, factory_id, company_id, isEdit}: PropsType): Field<keyof FormValues>[] => {
    const { data: buyers } = api.buyers.getAllBuyersByTeam.useQuery();
    const { data: factories } = api.factory.getAllFactories.useQuery();
    const { data: buyerBanks } = api.buyers.getBuyerBanks.useQuery(!!buyer_id ? buyer_id : skipToken);
    const { data: factoryBanks } = api.factory.getFactoryBanks.useQuery(!!factory_id ? { factory_id } : skipToken);
    const { data: companies } = api.companies.getAll.useQuery();
    const { data: rdlBanks } = api.companies.getRdlBanks.useQuery(!!company_id ? company_id : skipToken);
    const { data: destinations } = api.destinations.getAll.useQuery();
    const { data: freightTerms } = api.freightTerms.getAll.useQuery();
    const { data: contactPersons } = api.scContactPerson.getAll.useQuery();
    const { data: consignees } = api.buyers.getBuyerConsignees.useQuery(!!buyer_id ? buyer_id : skipToken);

    return [
        {
            name: 'sales_contract_no',
            label: 'Sales Contract No',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: 'select',
            options: buyers ? buyers.map(buyer => ({
                label: buyer.buyer_name,
                value: buyer.id.toString()
            })) : [],
            disabled: isEdit, // Disable buyer selection in edit mode
            optional: isEdit,
        },
        {
            name: 'factory_id',
            label: 'Factory',
            type: 'select',
            options: factories ? factories.map(factory => ({
                label: factory.name,
                value: factory.id.toString()
            })) : [],
            disabled: isEdit, // Disable factory selection in edit mode
            optional: isEdit,
        },
        {
            name: 'company_id',
            label: 'Company',
            type: 'select',
            options: companies ? companies.map(company => ({
                label: company.name,
                value: company.id.toString()
            })) : [],
        },
        {
            name: 'sales_contract_date',
            label: 'Sales Contract Date',
            type: 'date',
            optional: true,
        },
        {
            name: 'buyer_bank_id',
            label: 'Buyer Bank',
            type: 'select',
            options: buyerBanks ? buyerBanks.map(bank => ({
                label: bank.name,
                value: bank.id.toString()
            })) : [],
        },
        {
            name: 'factory_bank_id',
            label: 'Factory Bank',
            type: 'select',
            options: factoryBanks ? factoryBanks.map(bank => ({
                label: bank.name,
                value: bank.id.toString()
            })) : [],
        },
        {
            name: 'rdl_bank_id',
            label: 'Company Bank',
            type: 'select',
            options: rdlBanks ? rdlBanks.map(bank => ({
                label: bank.name,
                value: bank.id.toString()
            })) : [],
        },
        {
            name: 'negotiation_bank_id',
            label: 'Negotiation Bank',
            type: 'select',
            options: rdlBanks ? rdlBanks.map(bank => ({
                label: bank.name,
                value: bank.id.toString()
            })) : [],
        },
        {
            name: 'partial_shipment',
            label: 'Partial Shipment',
            type: 'select',
            options: [
                { label: 'ALLOWED', value: true },
                { label: 'NOT ALLOWED', value: false },
            ],
            optional: true,
        },
        {
            name: 'destination_id',
            label: 'Port of Loading',
            type: 'select',
            options: destinations ? destinations.map(dest => ({
                label: dest.name,
                value: dest.id.toString()
            })) : [],
        },
        {
            name: 'freight_terms_id',   
            label: 'Freight Terms',
            type: 'select',
            options: freightTerms ? freightTerms.map(term => ({
                label: term.name,
                value: term.id.toString()
            })) : [],
        },
        {
            name: 'contact_person_id',
            label: 'Contact Person',
            type: 'select',
            options: contactPersons ? contactPersons.map(contact => ({
                label: contact.name,
                value: contact.id.toString()
            })) : [],
        },
        {
            name: 'consignee_ids',
            label: 'Consignees',
            type: 'multiselect',
            options: consignees ? consignees.map(consignee => ({
                label: consignee.consignee_name,
                value: consignee.id.toString()
            })) : [],
        }
    ];
};