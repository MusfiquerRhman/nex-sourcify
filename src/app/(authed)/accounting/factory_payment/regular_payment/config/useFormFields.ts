import { api } from "~/trpc/react";
import type { FactoryPaymentFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FactoryPaymentFormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof FactoryPaymentFormValues>[] => {
    return [
        {
            name: "term_name",
            label: "Proceed Type",
            placeholder: "Select payment term",
            disabled: true,
            optional: true,
        },
        {
            name: 'fdbc_no',
            label: 'FDBC/TT No',
            disabled: true,
            optional: true,
        },
        {
            name: "realization_date",
            label: "Proceed Date",
            type: "date",
            disabled: true,
            optional: true,
        },
        {
            name: "rdl_invoice_value",
            label: "Invoice Value",
            disabled: true,
            optional: true,
        },
        {
            name: "realized_amount",
            label: "Proceed Amount",
            placeholder: "Enter realized amount",
            disabled: true,
            optional: true
        },
        {
            name: "factory_paid_amount",
            label: "Factory Paid Amount",
            placeholder: "Enter factory paid amount",
            disabled: true,
            optional: true,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            type: "textarea",
            optional: true,
        }
    ]
}