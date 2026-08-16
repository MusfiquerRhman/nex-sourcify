import { api } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import type { RDLInvoiceDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof RDLInvoiceDetailsFormValues> = BaseField<T>;

interface FactoryInvoiceProp {
    id: string, 
    invoice_no: string
};

export const formFields = ({factoryInvoices}: {factoryInvoices: FactoryInvoiceProp[] | undefined}): Field<keyof RDLInvoiceDetailsFormValues>[] => {
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })) ?? [],
        },
        {
            name: "factory_invoice_id", 
            label: "Factory Invoice",
            placeholder: "Select factory invoice",
            type: "select",
            options: factoryInvoices?.map((fi) => ({ label: fi.invoice_no, value: fi.id })) ?? [],
        },
        {
            name: 'quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            disabled: true,
            optional: true,
        },
        {
            name: "factory_value",
            label: "Factory Value",
            placeholder: "Enter factory value",
            disabled: true,
            optional: true,
        },
    ]
}