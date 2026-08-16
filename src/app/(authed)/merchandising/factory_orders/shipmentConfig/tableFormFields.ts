import type { BaseField } from "~/types/form";
import type { ShipmentFormValues } from "../config/formSchema";

export type Field<T extends keyof ShipmentFormValues> = BaseField<T>;

export const formFields = (canViewTransferRate: Boolean, disabled: boolean, hasPermission: boolean) => {
    const fields = [
        {
            name: 'buyer_po',
            label: 'Buyer PO',
            placeholder: 'Enter buyer PO',
            disabled: true,
        },
        {
            name: 'exfactory_date',
            label: 'Exfactory Date',
            placeholder: 'Select Exfactory date',
            type: 'date',
            disabled: disabled,
            optional: true,
        },
        {
            name: 'etd_date',
            label: 'ETD Date',
            placeholder: 'Select ETD date',
            disabled: true,
        },
        {
            name: 'handover_date',
            label: 'Handover Date',
            placeholder: 'Select handover date',
            disabled: true,
        },
        {
            name: 'destination_name',
            label: 'Destination Port',
            placeholder: 'Select destination port',
            disabled: true,
        },
        {
            name: 'shipment_mode',
            label: 'Shipment Mode',
            placeholder: 'Select shipment mode',
            disabled: true,
        },
        {
            name: 'payment_term',
            label: 'Payment Term',
            placeholder: 'Enter payment term',
            disabled: true,
        },
        {
            name: 'size_name',
            label: 'Size Range',
            placeholder: 'Select size range',
            disabled: true,
        },
        {
            name: 'colors',
            label: 'Colors (Quantity)',
            placeholder: 'Colors',
            disabled: true,
        },
        {
            name: 'lot_quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            disabled: true,
        },
        {
            name: 'factory_fob',
            label: 'Factory FOB Rate',
            placeholder: 'Enter Factory FOB Rate',
            type: 'number',
            disabled: disabled,
            optional: true,
        },
        {
            name: 'factory_value',
            label: 'Factory Value',
            placeholder: 'Factory Value',
            disabled: true,
        },
        {
            name: 'transfer_rate',
            label: 'Transfer Value',
            placeholder: 'Enter Transfer Value',
            type: 'number',
            disabled: !hasPermission,
        },
        {
            name: 'transfer_value',
            label: 'Transfer Value',
            placeholder: 'Transfer Value',
            disabled: true,
        },
    ]

    if(!canViewTransferRate){
        return fields.filter(
            field => field.name !== 'transfer_rate' && field.name !== 'transfer_value'
        );
    }
    return fields;
};
