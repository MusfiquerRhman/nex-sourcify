import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

interface TnaTerms {
    id: number; 
    term_description: string
}

interface Props {
    isEdit?: boolean
    tnaTerms: TnaTerms[]
}

export const formFields = (props: Props): Field<keyof FormValues>[] => {
    const { tnaTerms, isEdit } = props;

    const buyers = api.buyers.getAllBuyersByTeam.useQuery();

    return [
        {
            name: "template_name",
            label: "Template Name",
            type: "text",
            placeholder: "Enter template name",
        },
        {   
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyers.data?.map(buyer => ({ 
                value: buyer.id.toString(), 
                label: buyer.buyer_name 
            })) ?? [],
            placeholder: "Select Buyer",
            disabled: isEdit
        },
        {
            name: "term_id",
            label: "Term",
            type: "select",
            options: tnaTerms.map(term => ({ 
                value: term.id!.toString(), 
                label: term.term_description 
            })) ?? [],
            placeholder: "Select Term",
            disabled: isEdit
        }
    ];
};