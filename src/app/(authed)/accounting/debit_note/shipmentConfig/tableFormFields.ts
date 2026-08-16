import type { BaseField } from "~/types/form";
import type { DebitNoteDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof DebitNoteDetailsFormValues> = BaseField<T>;

interface ShipmentDetails { 
    id: string; 
    buyer_po: string; 
    invoice_no: string; 
    dn_value: number 
}

export const formFields = (shipmentDetails: ShipmentDetails[] | undefined, isEdit: boolean): Field<keyof DebitNoteDetailsFormValues>[] => {
    return [
        {
            name: 'exfactory_shipment_id',
            label: 'PO No',
            placeholder: 'Enter PO number',
            type: 'select',
            options: shipmentDetails?.map((shipment) => ({ label: shipment.buyer_po, value: shipment.id })) ?? [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "factory_invoice_no",
            label: "Factory Invoice No",
            placeholder: "Enter factory invoice number",
            disabled: true,
            optional: true,
        },
        {
            name: "value",
            label: "Value",
            placeholder: "Enter factory invoice date",
            disabled: true,
            optional: true,
        },
    ]
}
