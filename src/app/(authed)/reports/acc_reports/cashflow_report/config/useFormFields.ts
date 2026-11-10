import type { BaseField } from "~/types/form";
import type { CashflowReportFormValues } from "./formSchema";
import { api } from "~/trpc/react";

export const useFormFields = (): BaseField<keyof CashflowReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    return [
        {
            name: "from_date",
            label: "From Date (CI Date)",
            type: "date",
            optional: true,
        },
        {
            name: "to_date",
            label: "To Date (CI Date)",
            type: "date",
            optional: true,
        },
        {
            name: "buyer_ids",
            label: "Select Buyers",
            placeholder: "All buyers (select buyers to filter)",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            optional: true,
        },
    ];
};
