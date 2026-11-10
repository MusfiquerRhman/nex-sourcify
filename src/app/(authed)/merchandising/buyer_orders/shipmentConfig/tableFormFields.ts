import { api } from "~/trpc/react";
import type { ShipmentFormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof ShipmentFormValues> = BaseField<T>;

type Props = {
    buyerId: number;
    departmentId: number;
}

export const formFields = ({buyerId, departmentId}: Props) => {
    const { data: destinations = [] } = api.buyers.getBuyerDestinations.useQuery(
        !!buyerId ? buyerId : skipToken,
        { staleTime: 900 * 1000 }
    );

    const { data: paymentTerms = [] } = api.buyers.getBuyerPaymentTerms.useQuery(
        !!buyerId ? buyerId : skipToken,
        { staleTime: 900 * 1000 }
    );

    const { data: sizes = [] } = api.buyers.getSizeByDepartment.useQuery(
        !!departmentId ? departmentId : skipToken,
        { staleTime: 900 * 1000 }
    );

    return [
        {
            name: 'buyer_po',
            label: 'Buyer PO',
            placeholder: 'Enter buyer PO',
        },
        {
            name: 'etd_date',
            label: 'ETD Date',
            placeholder: 'Select ETD date',
            type: 'date',
        },
        {
            name: 'handover_date',
            label: 'Handover Date',
            placeholder: 'Select handover date',
            type: 'date',
        },
        {
            name: 'destination_id',
            label: 'Destination Port',
            placeholder: 'Select destination port',
            type: 'select',
            options: destinations.map(dest => ({
                label: dest.name ?? '',
                value: dest.id?.toString() ?? '',
            })),
        },
        {
            name: 'shipment_mode',
            label: 'Shipment Mode',
            placeholder: 'Select shipment mode',
            type: 'select',
            options: [
                { label: 'AIR', value: 'AIR' },
                { label: 'SEA', value: 'SEA' },
                { label: 'LAND', value: 'LAND' },
            ],
        },
        {
            name: 'payment_term_id',
            label: 'Payment Term',
            placeholder: 'Enter payment term',
            type: 'select',
            options: paymentTerms.map(pt => ({
                label: pt.term_description ?? '',
                value: (pt?.id ?? '').toString(),
            })),
        },
        {
            name: 'size_id',
            label: 'Size Range',
            placeholder: 'Select size range',
            type: 'select',
            options: sizes.map(size => ({
                label: size.size ?? '',
                value: size.id.toString(),
            })),
        },
        {
            name: 'add_colors',
            label: 'Show/Add Colors',
            placeholder: 'Enter colors',
            type: 'button',
        },
        {
            name: 'selected_colors',
            label: 'Colors',
            placeholder: 'Enter Colors',
            disabled: true,
        },
        {
            name: 'lot_quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            type: 'number',
            disabled: true,
        },
        {
            name: 'fob_rate',
            label: 'Company FOB',
            placeholder: 'Enter Company FOB',
            type: 'number',
        },
        {
            name: 'rdl_fob_usd',
            label: 'Company FOB USD',
            placeholder: 'Enter Company FOB USD',
            disabled: true,
        },
        {
            name: 'rdl_value',
            label: 'Company Value',
            placeholder: 'Enter Company Value',
            disabled: true,
        },
        {
            name: 'rdl_value_usd',
            label: 'Company Value USD',
            placeholder: 'Enter Company Value USD',
            disabled: true,
        },
    ]
};
