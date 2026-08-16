import type { CrossPaymentDetailsFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CrossPaymentDetailsFormValues> = BaseField<T>;

interface FormProps {
    factoryInvoice?: {
        id: string;
        invoice_no: string;
    }[];

    isEdit: boolean;
}

export const formFields = ({factoryInvoice, isEdit}: FormProps): Field<keyof CrossPaymentDetailsFormValues>[] => {
    return [
        {
            name: "factory_invoice_id",
            label: "Invoice No",
            placeholder: "Enter invoice no",
            type: "select",
            options: factoryInvoice?.map((invoice) => ({ label: invoice.invoice_no, value: invoice.id })) ?? [],
            optional: isEdit,
            disabled: isEdit,
        },
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_invoice_date",
            label: "Invoice Date",
            placeholder: "Enter invoice date",
            optional: true,
            disabled: true,
        },
        {
            name: "invoice_quantity",
            label: "Invoice Quantity",
            placeholder: "Enter invoice quantity",
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
            name: "value",
            label: "Paid Amount",
            placeholder: "Enter paid amount",
            type: "number",
            optional: true,
        },
        {
            name: "factory_payment_no",
            label: "Factory Payment No",
            placeholder: "Enter factory payment no",
            optional: true,
        },
        {
            name: "factory_payment_date",
            label: "Payment Date",
            placeholder: "Enter payment date",
            type: "date",
            optional: isEdit,
            disabled: isEdit,
        },
        {
            name: "regularized",
            label: "Regularized",
            placeholder: "Enter regularized",
            optional: true,
            disabled: true,
        }
    ]
}
