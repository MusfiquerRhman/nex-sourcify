import { api } from "~/trpc/react";
import type { ExportSummaryReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ExportSummaryReportFormValues> = BaseField<T>;

interface LCs {
    id: string;
    sc_lc_no: string;
}

export const useFormFields = ({LCs}: {LCs: LCs[]}): Field<keyof ExportSummaryReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    return [
        {
            name: "base",
            label: "Select type",
            placeholder: "Select type",
            type: "select",
            options: [
                { label: 'LC Summary', value: 'LC' }, 
                { label: 'Sales Contract Summary', value: 'SC' }
            ],
            optional: true,
        },
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
        {
            name: 'lcIds',
            label: "Select LC/SCs",
            placeholder: "Select LC, or leave blank for all",
            type: "multiselect",
            options: LCs.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            optional: true,
        }
    ]
}