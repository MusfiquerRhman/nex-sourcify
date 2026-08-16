import type { LCShipmentValue } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof LCShipmentValue> = BaseField<T>;

export const formFields = (): Field<keyof LCShipmentValue>[] => {
    
    return [
        {
            name: "checked",
            label: "Checked",
            type: "checkbox",
            optional: true,
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
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
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
            name: "quantity",
            label: "Quantity",
            placeholder: "Enter quantity",  
            optional: true,
            disabled: true,
        },
        {
            name: "rdl_fob",
            label: "FOB",
            placeholder: "Enter FOB",
            optional: true,
            disabled: true,
        },
        {
            name: "rdl_value",
            label: "Value",
            placeholder: "Enter value",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_transfer_value",
            label: "Factory Transfer Value",
            placeholder: "Enter factory transfer value",
            optional: true,
            disabled: true,
        },
    ]
}