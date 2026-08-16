import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { boolean } from "zod";

export type Field<T extends keyof FormValues> = BaseField<T>;

interface Props {
    isEdit: boolean,
    buyers: {id: number, buyer_name: string}[]
}

export const formFields = (props: Props): Field<keyof FormValues>[] => {
    const { isEdit, buyers } = props;

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
            name: 'other_percentage',
            label: 'Other Percentage',
            type: "number",
            disabled: false,
            optional: false,
        },
        {
            name: 'overseas_percentage',
            label: 'Overseas Percentage',
            type: "number",
            disabled: false,
            optional: false,
        },
    ];
}