import type { ExFactoryShipmentValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ExFactoryShipmentValues> = BaseField<T>;

interface FormFieldsProps {
    isEdit?: boolean;
    isAdmin?: boolean;
}

export const formFields = (Props?: FormFieldsProps): Field<keyof ExFactoryShipmentValues>[] => {
    const { isEdit, isAdmin } = Props || {};

    return [
        {
            name: "style_no",
            label: "Style No",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "po_no",
            label: "PO No",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: 'colors',
            label: 'Colors',
            type: "text",
            disabled: true,
            optional: true,
        }, 
        {
            name: 'destination',
            label: 'Destination',
            type: "text",
            disabled: true,
            optional: true,
        }, 
        {
            name: "lot_quantity",
            label: "Lot Quantity",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "previous_shipment_quantity",
            label: "Previous Shipment Quantity",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "shipment_quantity",
            label: "Shipment Quantity",
            placeholder: "Enter shipment quantity",
            type: "number",
            disabled: isEdit && !isAdmin,
            optional: false,
        },
        {
            name: 'shipment_mode',
            label: 'Shipment Mode',
            type: 'select',
            options: [
                { label: 'AIR', value: 'AIR' },
                { label: 'SEA', value: 'SEA' },
                { label: 'LAND', value: 'LAND' },
            ],
            optional: true,
        },
        {
            name: "po_close",
            label: "PO Close",
            type: "checkbox",
            optional: true,
        }
    ]
}