import type { BaseField } from "~/types/form";
import type { StyleFormValues } from "../config/formSchema";

export type Field<T extends keyof StyleFormValues> = BaseField<T>;

export const formFields = (): Field<keyof StyleFormValues>[] => {
    return [
        {
            name: "product_type_name",
            label: "Product Type",
            placeholder: "Select product type",
            disabled: true,
        },
        {
            name: "product_name", 
            label: "Product",
            placeholder: "Select product",
            disabled: true,
        },
        {
            name: 'style',
            label: 'Style',
            placeholder: 'Enter style',
            disabled: true,
        },
        {
            name: "fabric_name",
            label: "Fabric",
            placeholder: "Select fabric",
            disabled: true,
        },
        {
            name: "supplier_name",
            label: "Fabric Supplier",
            placeholder: "Select fabric supplier",
            disabled: true,
        },
        {
            name: 'order_quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            disabled: true,
        }
    ]
}