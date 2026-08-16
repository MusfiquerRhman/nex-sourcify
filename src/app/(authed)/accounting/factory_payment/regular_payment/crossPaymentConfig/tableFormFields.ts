import type { CrossPaymentDetailsFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CrossPaymentDetailsFormValues> = BaseField<T>;
    
export const crossPaymentFormFields = (isRegularized: boolean, can_update: boolean) => {
    return [
        {
            name: "factory_invoice_no",
            label: "Invoice No",
            placeholder: "Enter invoice no",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_payment_no",
            label: "Factory Payment No",
            placeholder: "Enter factory payment no",
            optional: true,
            disabled: true,
        },
        {
            name: "paid_amount",
            label: "Paid Amount",
            placeholder: "Enter paid amount",
            optional: true,
            disabled: true,
        },
        {
            name: "payment_date",
            label: "Payment Date",
            placeholder: "Enter payment date",
            optional: true,
            disabled: true,
        },
        {
            name: 'regularized',
            label: 'Regularize',
            placeholder: 'Enter colors',
            type: (isRegularized || !can_update) ? 'text' : 'button',
            disabled: isRegularized || !can_update,
        },
    ]
}
