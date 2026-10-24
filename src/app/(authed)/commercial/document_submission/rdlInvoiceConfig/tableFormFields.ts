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
            label: "rdl Invoice",
            placeholder: "Select NexSourcify invoice",
            type: "select",
            options: rdlInvoice?.map((f) => ({ label: f.invoice_no, value: f.id.toString() })) ?? [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'invoice_date',
            label: 'Invoice Date',
            placeholder: 'Enter invoice date',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "rdl_value",
            label: "NexSourcify Value",
            placeholder: "Enter NexSourcify value",
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "previously_received_rdl_value",
            label: "Previously Received NexSourcify Value",
            placeholder: "Enter NexSourcify value",
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "received_rdl_value",
            label: "Received NexSourcify Value",
            placeholder: "Enter NexSourcify value",
        },
    ]
}