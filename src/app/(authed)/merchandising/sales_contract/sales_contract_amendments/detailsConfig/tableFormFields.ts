import type { BaseField } from "~/types/form";
import type { SalesContractDetailsValues } from "../config/formSchema";

export type Field<T extends keyof SalesContractDetailsValues> = BaseField<T>;

type Props = {
    orders: { id: number; ref_no: string }[];
    disabledUpto?: number;
    index?: number;
}

export const formFields = ({ orders, disabledUpto, index }: Props): Field<keyof SalesContractDetailsValues>[] => {
    return [
        {
            name: 'order_id',
            label: 'Order Reference No',
            type: 'select',
            options: orders ? orders.map(order => ({
                label: order.ref_no,
                value: order.id.toString()
            })) : [],
            disabled: disabledUpto !== undefined && index !== undefined ? index <= disabledUpto - 1 : false,
        },
        {
            name: 'buyer_name',
            label: 'Buyer Name',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'season_name',
            label: 'Season',
            type: 'text',
            disabled: true,
            optional: true,
        },
    ];
}