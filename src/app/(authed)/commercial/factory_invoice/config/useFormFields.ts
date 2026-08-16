/**
 * @description
 * This file defines the form fields for the factory invoice form in the commercial module of the application. 
 * It uses data fetched from the API to populate select options for fields like factory, buyer, payment terms, and LC/SC. 
 * The `useFormFields` hook returns an array of field configurations that can be used to render the form dynamically. 
 * Each field configuration includes properties such as `name`, `label`, `type`, `options`, `disabled`, and `optional` to control the behavior and appearance of the form fields.
 */

import { api } from "~/trpc/react";
import type { FactoryInvoiceFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof FactoryInvoiceFormValues> = BaseField<T>;

interface LCListItem {
    id: string;
    sc_lc_no: string;
}

interface PropsType {
    lcList: LCListItem[];
    isEdit: boolean;
    buyer_id: number;
}

export const useFormFields = ({lcList, isEdit, buyer_id}: PropsType): Field<keyof FactoryInvoiceFormValues>[] => {
    const factories = api.factory.getAllFactories.useQuery().data ?? [];
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const { data: destinations } = api.destinations.getAll.useQuery();
    const { data: freightTerms } = api.freightTerms.getAll.useQuery();
    const { data: consignees } = api.buyers.getBuyerConsignees.useQuery(!!buyer_id ? buyer_id : skipToken);

    return [
        {
            name: 'factory_id',
            label: 'Factory',
            type: "select",
            options: factories.map((factory) => ({ label: factory.name, value: factory.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "term_id",
            label: "Select Payment Term",
            placeholder: "Select payment term",
            type: "select",
            options: terms.map((term) => ({ label: term.name, value: term.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "lc_sc_id",
            label: "Select LC/SC",
            type: "select",
            options: lcList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "invoice_no",
            label: "Invoice No",
            type: "text",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "invoice_date",
            label: "Invoice Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "freight_term_id",
            label: "Select Freight Term",
            placeholder: "Select freight term",
            type: "select",
            options: freightTerms ? freightTerms.map((term) => ({ label: term.name, value: term.id })) : [],
            optional: true,
        },
        {
            name: "port_of_loading",
            label: "Port of Loading",
            placeholder: "Select port of loading",
            type: "select",
            options: destinations ? destinations.map((dest) => ({ label: dest.name, value: dest.id })) : [],
            optional: true,
        },
        {
            name: "invoice_quantity",
            label: "Invoice Quantity",
            placeholder: "Enter total quantity for the invoice",
            optional: true,
            disabled: true,
        },
        {
            name: "invoice_value",
            label: "Invoice Value",
            placeholder: "Enter total value for the invoice",
            optional: true,
            disabled: true,
        },
        {
            name: 'shipment_mode',
            label: 'Shipment Mode',
            type: 'select',
            options: [
                { label: 'AIR', value: 'AIR' },
                { label: 'SEA', value: 'SEA' },
                { label: 'LAND', value: 'LAND' },
            ],
            optional: true,
        },
        {
            name: "discount",
            label: "Discount",
            type: "number",
            placeholder: "Enter discount amount",
            optional: true,
        },
        {
            name: "total_value",
            label: "Total Value",
            placeholder: "Enter total value after discount",
            optional: true,
            disabled: true,
        },
        {
            name: 'consignee_ids',
            label: 'Consignees',
            type: 'multiselect',
            options: consignees ? consignees.map(consignee => ({
                label: consignee.consignee_name,
                value: consignee.id
            })) : [],
        },
        {
            name: 'notifyParties',
            label: 'Notify Parties',
            type: 'multiselect',
            options: consignees ? consignees.map(consignee => ({
                label: consignee.consignee_name,
                value: consignee.id
            })) : [],
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}