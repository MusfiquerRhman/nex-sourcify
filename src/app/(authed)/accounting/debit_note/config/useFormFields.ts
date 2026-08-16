import { api } from "~/trpc/react";
import type { DebitNoteFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof DebitNoteFormValues> = BaseField<T>;

interface LCListItem {
    lc_sc_id: string;
    sc_lc_no: string;
}

interface PropsType {
    lcList: LCListItem[];
    isEdit: boolean;
}

export const useFormFields = ({lcList, isEdit}: PropsType): Field<keyof DebitNoteFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
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
            name: 'dn_ref',
            label: 'Debit Note Reference',
            disabled: true,
            optional: true,
        },
        {
            name: "dn_date",
            label: "Debit Note Date",
            type: "date",
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
            name: 'factory_id',
            label: 'Factory',
            type: "select",
            options: factories.map((factory) => ({ label: factory.name, value: factory.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "lc_sc_id",
            label: "Select LC/SC",
            type: "select",
            options: lcList.map((lc) => ({ label: lc.sc_lc_no, value: lc.lc_sc_id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "less",
            label: "Less Amount",
            placeholder: "Enter less amount",
            type: "number",
            optional: true,
        },
        {
            name: "processing_charges",
            label: "Processing Charges(%)",
            placeholder: "Enter processing charges",
            type: "number",
            optional: true,
        },
        {
            name: "conversion_rate",
            label: "Conversion Rate",
            placeholder: "Enter conversion rate",
            type: "number",
            optional: true,
        },
        {
            name: "additional_charges",
            label: "Additional Charges(%)",
            placeholder: "Enter additional charges",
            type: "number",
            optional: true,
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