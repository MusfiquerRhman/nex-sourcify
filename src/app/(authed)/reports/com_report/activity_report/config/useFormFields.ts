import { api } from "~/trpc/react";
import type { ActivityReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ActivityReportFormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof ActivityReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    return [
        {
            name: "from_date",
            label: "From Date",
            type: "date",
            optional: true
        },
        {
            name: "to_date",
            label: "To Date",
            type: "date",
            optional: true
        },
        {
            name: "buyer_ids",
            label: "Select Buyers",
            placeholder: "Select buyers, or leave blank for all",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            optional: true,
        },
    ]
}