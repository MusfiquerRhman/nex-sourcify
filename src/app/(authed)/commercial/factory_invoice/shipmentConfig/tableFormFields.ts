import type { FactoryInvoiceDetailsFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FactoryInvoiceDetailsFormValues> = BaseField<T>;

export const formFields = (): Field<keyof FactoryInvoiceDetailsFormValues>[] => {
    return [
        {
            name: "checked",
            label: "Checked",
            type: "checkbox",
            optional: true,
        },
        {
            name: "order_no",
            label: "Order No",
            placeholder: "Enter order no",
            optional: true,
            disabled: true,
        },
        {
            name: "style",
            label: "Style",
            placeholder: "Enter style",
            optional: true,
            disabled: true,
        },
        {
            name: "po",
            label: "PO",
            placeholder: "Enter PO",
            optional: true,
            disabled: true,
        },
        {
            name: "exfactory_date",
            label: "Ex-Factory Date",
            placeholder: "Enter ex-factory date",
            optional: true,
            disabled: true,
        },
        {
            name: "destination",
            label: "Destination",
            placeholder: "Enter destination",
            optional: true,
            disabled: true,
        },
        {
            name: "order_quantity",
            label: "Order Quantity",
            placeholder: "Enter order quantity",
            optional: true,
            disabled: true,
        },
        {
            name: "delivery_quantity",
            label: "Delivery Quantity",
            placeholder: "Enter delivery quantity",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_fob",
            label: "Factory FOB",
            placeholder: "Enter factory FOB",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_value",
            label: "Factory Value",
            placeholder: "Enter factory value",
            optional: true,
            disabled: true,
        },
    ]
}

export const formFieldsWithoutCheckbox = (): Field<keyof FactoryInvoiceDetailsFormValues>[] => {
    return formFields().filter(field => field.name !== "checked");
};