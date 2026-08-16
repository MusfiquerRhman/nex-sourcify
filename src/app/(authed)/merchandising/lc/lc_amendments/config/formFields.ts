import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof FormValues> = BaseField<T>;

interface PropsType {
    isEdit?: boolean;
    company_id?: number;
    buyer_id?: number;
    lcAmendmentId?: string;
}

// Function to generate form fields for LC Master form, with dynamic options based on company and buyer selection
export const formFields = ({ isEdit, company_id, buyer_id, lcAmendmentId }: PropsType): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAll.useQuery().data ?? [];
    const lc = api.lcAmendment.getLcForAmendment.useQuery(!!buyer_id ? { buyer_id, lcAmendmentId } : skipToken).data;
    const currencies = api.currencies.getAll.useQuery().data ?? [];
    const { data: companies } = api.companies.getAll.useQuery();
    const { data: rdlBanks } = api.companies.getRdlBanks.useQuery(!!company_id ? company_id : skipToken);
    const { data: buyerBanks } = api.buyers.getBuyerBanks.useQuery(!!buyer_id ? buyer_id : skipToken);
     
    return [
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: 'select',
            options: buyers.map(buyer => ({ 
                value: buyer.id, 
                label: buyer.buyer_name 
            })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'lc_id',
            label: 'LC No',
            type: 'select',
            options: lc ? lc.map(lc => ({
                value: lc.id,
                label: lc.lc_no,
            })) : [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'amendment_no',
            label: 'Amendment No',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'company_id',
            label: 'Company',
            type: 'select',
            options: (companies ?? []).map(company => ({ 
                value: company.id, 
                label: company.name 
            })) || [],
            disabled: true,
            optional: true,
        },
        {
            name: 'lc_quantity',
            label: 'LC Quantity',
            type: 'number',
        },
        {
            name: 'lc_value',
            label: 'LC Value',
            type: 'number',
        },
        {
            name: 'currency_id',
            label: 'Currency',
            type: 'select',
            options: currencies.map(currency => ({ 
                value: currency.id, 
                label: currency.name 
            })) || [],
            disabled: true,
            optional: true,
        },
        {
            name: 'rdl_bank_id',
            label: 'Bank',
            type: 'select',
            options: (rdlBanks ?? []).map(bank => ({ 
                label: bank.name,
                value: bank.id
            })) || [],
        },
        {
            name: 'buyer_bank_id',
            label: 'Buyer Bank',
            type: 'select',
            options: (buyerBanks ?? []).map(bank => ({ 
                value: bank.id, 
                label: bank.name 
            })) || [],
        },
        {
            name: 'lc_open_date',
            label: 'LC Open Date',
            type: 'date',
            disabled: true,
            optional: true,
        },
        {
            name: 'lc_received_date',
            label: 'LC Received Date',
            type: 'date',
            disabled: true,
            optional: true,
        },
        {
            name: 'latest_shipment_date',
            label: 'Latest Shipment Date',
            type: 'date',
            optional: true,
        },
        {
            name: 'expire_date',
            label: 'Expire Date',
            type: 'date',
            optional: true,
        },
        {
            name: 'lc_status',
            label: 'LC Status',
            type: 'select',
            options: [
                { value: true, label: 'OPEN' },
                { value: false, label: 'CLOSED' },
            ],
            optional: true,
        },
        {
            name: 'order_lc_quantity',
            label: 'Order LC Quantity',
            disabled: true,
            optional: true,
        },
        {
            name: 'order_lc_value',
            label: 'Order LC Value',
            disabled: true,
            optional: true,
        },
        {
            name: 'remarks',
            label: 'Remarks',
            type: 'textarea',
            optional: true,
        },
    ];
};