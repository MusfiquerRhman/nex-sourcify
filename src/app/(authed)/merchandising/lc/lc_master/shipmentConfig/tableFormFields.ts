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
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "po",
            label: "PO",
            placeholder: "Enter PO",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "exfactory_date",
            label: "Ex-Factory Date",
            placeholder: "Enter ex-factory date",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "destination",
            label: "Destination",
            placeholder: "Enter destination",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "quantity",
            label: "Quantity",
            placeholder: "Enter quantity",  
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "rdl_fob",
            label: "Company FOB",
            placeholder: "Enter Company FOB",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "rdl_value",
            label: "Company Value",
            placeholder: "Enter Company value",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "factory_transfer_value",
            label: "Factory Transfer Value",
            placeholder: "Enter factory transfer value",
            type: 'text',
            optional: true,
            disabled: true,
        },
    ]
}