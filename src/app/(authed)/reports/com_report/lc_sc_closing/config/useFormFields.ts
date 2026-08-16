import { api } from "~/trpc/react";
import type { LcScClosingReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof LcScClosingReportFormValues> = BaseField<T>;

interface LCs {
    id: string;
    sc_lc_no: string;
}

export const useFormFields = ({LCs}: {LCs: LCs[]}): Field<keyof LcScClosingReportFormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();

    return [
        {
            name: "base",
            label: "Select type",
            placeholder: "Select type",
            type: "select",
            options: [
                { label: 'LC Closing', value: 'LC' }, 
                { label: 'Sales Contract Closing', value: 'SC' }
            ],
        },
        {
            name: "buyer_id",
            label: "Buyer",
            options: buyers.data?.map((b) => ({ label: b.buyer_name, value: b.id.toString() })) ?? [],
            type: "select"
        },
        {
            name: 'lcId',
            label: "Select LC/SC",
            placeholder: "Select LC, or leave blank for all",
            type: "select",
            options: LCs.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
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
    ]
}