import { api } from "~/trpc/react";
import type { CrossPaymentFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CrossPaymentFormValues> = BaseField<T>;

interface PropsType {
    isEdit: boolean;
}

export const useFormFields = ({isEdit}: PropsType): Field<keyof CrossPaymentFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const terms = api.terms.getAllTerms.useQuery().data ?? [];

    return [
        {
            name: 'cross_payment_ref',
            label: 'Cross Payment Reference',
            disabled: true,
            optional: true,
        },
        {
            name: "term_id",
            label: "Select Payment Term",
            placeholder: "Select payment term",
            type: "select",
            options: terms.map((term) => ({ label: term.name, value: term.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "cross_payment_date",
            label: "Cross Payment Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            type: "textarea",
            optional: true,
        }
    ]
}