import type { BaseField } from "~/types/form";
import type { FactoryInvoiceDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof FactoryInvoiceDetailsFormValues> = BaseField<T>;

export const formFields = () => {
    return [
        {
            name: 'order_no',
            label: 'Order No',
            placeholder: 'Enter order no',
            disabled: true,
            optional: true,
        },
        {
            name: 'style',
            label: 'Style No',
            placeholder: 'Enter style no',
            disabled: true,
            optional: true,
        },
        {
            name: 'po',
            label: 'PO',
            placeholder: 'Enter PO',
            disabled: true,
            optional: true,
        },
        {
            name: 'destination_port',
            label: 'Destination Port',
            placeholder: 'Select destination port',
            disabled: true,
            optional: true,
        },
        {
            name: 'order_quantity',
            label: 'Order Quantity',
            placeholder: 'Enter order quantity',
            disabled: true,
            optional: true,
        },
        {
            name: 'previous_quantity',
            label: 'Previous Quantity',
            placeholder: 'Enter previous quantity',
            disabled: true,
            optional: true,
        },
        {
            name: 'invoice_quantity',
            label: 'Invoice Quantity',
            placeholder: 'Enter invoice quantity',
            type: 'number',
        },
        {
            name: 'invoice_fob',
            label: 'Invoice FOB',
            placeholder: 'Enter invoice FOB',
            disabled: true,
            optional: true,
        },
        {
            name: 'invoice_value',
            label: 'Invoice Value',
            placeholder: 'Enter invoice value',
            disabled: true,
            optional: true,
        },
    ]
};
