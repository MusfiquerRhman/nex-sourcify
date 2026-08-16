import type { BaseField } from "~/types/form";
import type { FactoryInvoiceDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof FactoryInvoiceDetailsFormValues> = BaseField<T>;

export const formFields = (): Field<keyof FactoryInvoiceDetailsFormValues>[] => {
    return [
        {
            name: 'factory_name',
            label: 'Factory Name',
            placeholder: 'Enter factory name',
            disabled: true,
            optional: true,
        },
        {
            name: "factory_invoice_no",
            label: "Factory Invoice No",
            placeholder: "Enter factory invoice number",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_fdbc_no",
            label: "Factory FDBC No",
            placeholder: "Enter factory FDBC number",
        },
        {
            name: "factory_invoice_date",
            label: "Factory Invoice Date",
            placeholder: "Enter factory invoice date",
            disabled: true,
            optional: true,
        },
        {
            name: "quantity",
            label: "Quantity",
            placeholder: "Enter quantity",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_invoice_value",
            label: "Factory Invoice Value",
            placeholder: "Enter factory invoice value",
            disabled: true,
            optional: true,
        },
    ]
}
