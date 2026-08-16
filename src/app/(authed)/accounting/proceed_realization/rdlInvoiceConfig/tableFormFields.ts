import type { RDLInvoiceDetailsFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof RDLInvoiceDetailsFormValues> = BaseField<T>;

export const formFields = (): Field<keyof RDLInvoiceDetailsFormValues>[] => {
    return [
        {
            name: "rdl_invoice_no",
            label: "Invoice No",
            placeholder: "Enter invoice no",
            optional: true,
            disabled: true,
        },
        {
            name: "invoice_value",
            label: "Invoice Value",
            placeholder: "Enter invoice value",
            optional: true,
            disabled: true,
        },
        {
            name: "proceed_value",
            label: "Factory Value",
            placeholder: "Enter factory value",
            type: "number",
        },
    ]
}
