import type { BaseField } from "~/types/form";
import type { DocumentSubmissionDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof DocumentSubmissionDetailsFormValues> = BaseField<T>;

interface RDLInvoiceProp {
    id: string, 
    invoice_no: string
};

export const formFields = ({rdlInvoice, isEdit}: {rdlInvoice: RDLInvoiceProp[] | undefined, isEdit: boolean}): Field<keyof DocumentSubmissionDetailsFormValues>[] => {
    return [
        {
            name: "rdl_invoice_id",
            label: "Invoice",
            placeholder: "Select Invoice",
            type: "select",
            options: rdlInvoice?.map((f) => ({ label: f.invoice_no, value: f.id.toString() })) ?? [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'invoice_date',
            label: 'Invoice Date',
            placeholder: 'Enter invoice date',
            disabled: true,
            optional: true,
        },
        {
            name: 'quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            disabled: true,
            optional: true,
        },
        {
            name: "rdl_value",
            label: "Value",
            placeholder: "Enter value",
            disabled: true,
            optional: true,
        },
        {
            name: "previously_received_rdl_value",
            label: "Previously Received Value",
            placeholder: "Enter value",
            disabled: true,
            optional: true,
        },
        {
            name: "received_rdl_value",
            label: "Received Value",
            placeholder: "Enter value",
        },
    ]
}