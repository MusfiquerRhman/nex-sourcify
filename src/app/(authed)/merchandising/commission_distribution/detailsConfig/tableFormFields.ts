import type { BaseField } from "~/types/form";
import type { CommissionDistributionDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof CommissionDistributionDetailsFormValues> = BaseField<T>;

export const formFields = () => {
    const fields = [
        {
            name: 'style',
            label: 'Style',
            placeholder: 'Enter style',
            disabled: true,
        },
        {
            name: 'po',
            label: 'PO',
            placeholder: 'Enter PO',
            disabled: true,
        },
        {
            name: 'destination',
            label: 'Destination',
            placeholder: 'Enter destination',
            disabled: true,
        },
        {
            name: 'size',
            label: 'Size',
            placeholder: 'Enter size',
            disabled: true,
        },
        {
            name: 'order_quantity',
            label: 'Order Quantity',
            placeholder: 'Enter order quantity',
            disabled: true,
            optional: true,
        },
        {
            name: 'rdl_fob',
            label: 'FOB',
            placeholder: 'Enter FOB',
            disabled: true,
        },
        {
            name: 'factory_fob',
            label: 'Factory FOB',
            placeholder: 'Enter factory FOB',
            disabled: true,
        },
        {
            name: 'rdl_value',
            label: 'Value',
            placeholder: 'Enter value',
            disabled: true,
        },
        {
            name: 'factory_value',
            label: 'Factory Value',
            placeholder: 'Enter factory value',
            disabled: true,
        },
        {
            name: 'margin_per_piece',
            label: 'Margin Per Piece',
            placeholder: 'Enter margin per piece',
            disabled: true,
        },
        {
            name: 'commission_value',
            label: 'Commission Value',
            placeholder: 'Enter commission value',
            disabled: true,
        },
        {
            name: 'commission_percentage',
            label: 'Commission Percentage',
            placeholder: 'Enter commission percentage',
            disabled: true,
        },
        {
            name: 'dhaka_commission_percentage',
            label: 'Dhaka Commission Percentage',
            placeholder: 'Enter Dhaka commission percentage',
            disabled: true,
            type: 'number',
        },
        {
            name: 'dhaka_commission_amount',
            label: 'Dhaka Commission Amount',
            disabled: true,
        },
        {
            name: 'overseas_commission_percentage',
            label: 'Overseas Commission Percentage',
            placeholder: 'Enter Overseas commission percentage',
            type: 'number',
        },
        {
            name: 'overseas_commission_amount',
            label: 'Overseas Commission Amount',
            disabled: true,
        },
        {
            name: 'others_commission_percentage',
            label: 'Others Commission Percentage',
            placeholder: 'Enter Others commission percentage',
            type: 'number',
        },
        {
            name: 'others_commission_amount',
            label: 'Others Commission Amount',
            disabled: true,
        }
    ]

    return fields;
};
