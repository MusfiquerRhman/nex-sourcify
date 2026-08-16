/**
 * @description
 * This file defines the form fields for the factory invoice form in the commercial module of the application. 
 * It uses data fetched from the API to populate select options for fields like factory, buyer, payment terms, and LC/SC. 
 * The `useFormFields` hook returns an array of field configurations that can be used to render the form dynamically. 
 * Each field configuration includes properties such as `name`, `label`, `type`, `options`, `disabled`, and `optional` to control the behavior and appearance of the form fields.
 */

import { api } from "~/trpc/react";
import type { ProceedRealizationFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ProceedRealizationFormValues> = BaseField<T>;

interface documentSubmissions {
    id: string;
    fdbc_no: string;
}

interface PropsType {
    documentSubmissions: documentSubmissions[];
    isEdit: boolean;
    buyer_id: number;
}

export const useFormFields = ({documentSubmissions, isEdit, buyer_id}: PropsType): Field<keyof ProceedRealizationFormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    return [
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
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "proceed_date",
            label: "Proceed Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "document_submission_id",
            label: "FDBC No",
            type: "select",
            options: documentSubmissions.map((ds) => ({ label: ds.fdbc_no, value: ds.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "lc_sc_no",
            label: "LC/SC No",
            type: "text",
            disabled: true,
            optional: true
        },
        {
            name: "bank_charge",
            label: "Bank Charge",
            placeholder: "Enter bank charge",
            type: "number",
            optional: true,
        },
        {
            name: "document_charge",
            label: "Document Charge",
            placeholder: "Enter document charge",
            type: "number",
            optional: true,
        },
        {
            name: "discount_charge",
            label: "Discount Charge",
            placeholder: "Enter discount charge",
            type: "number",
            optional: true,
        },
        {
            name: "invoice_value",
            label: "Proceed Value",
            placeholder: "Enter Invoice Value",
            optional: true,
            disabled: true,
        },
    ]
}