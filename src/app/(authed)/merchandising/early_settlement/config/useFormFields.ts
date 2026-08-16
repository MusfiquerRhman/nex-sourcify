import { api } from "~/trpc/react";
import type { EarlySettlementFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof EarlySettlementFormValues> = BaseField<T>;

interface FieldProps {
    isEdit: boolean;
    buyer_id?: string;
}

export const useFormFields = ({isEdit, buyer_id}: FieldProps): Field<keyof EarlySettlementFormValues>[] => {
    const buyers = api.earlySettlement.getBuyersForEarlySettlement.useQuery().data ?? [];

    const orders = api.earlySettlement.getOrderForEarlySettlement.useQuery(
        !!buyer_id ? {buyer_id: Number(buyer_id)} : skipToken
    ).data ?? [];

    return [
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'order_id',
            label: 'Order References',
            type: "select",
            options: orders.map((order) => ({ label: order.ref_no, value: order.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}