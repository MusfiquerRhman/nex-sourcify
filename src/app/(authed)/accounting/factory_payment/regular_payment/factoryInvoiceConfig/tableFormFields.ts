import type { FactoryPaymentDetailsFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FactoryPaymentDetailsFormValues> = BaseField<T>;

export const formFields = (): Field<keyof FactoryPaymentDetailsFormValues>[] => {
    return [
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_invoice_no",
            label: "Invoice No",
            placeholder: "Enter invoice no",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_fdbc_no",
            label: "Factory FDBC No",
            placeholder: "Enter FDBC no",
            optional: true,
            disabled: true,
        },
        {
            name: "invoice_date",
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
            name: "paid_amount",
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
            name: "payment_date",
            label: "Payment Date",
            placeholder: "Enter payment date",
            type: "date",
            optional: true,
        },
    ]
}
