import { api } from "~/trpc/react";
import type { LcTransferReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof LcTransferReportFormValues> = BaseField<T>;

interface LCs {
    id: string;
    lc_no: string;
}

export const useFormFields = ({LCs}: {LCs: LCs[]}): Field<keyof LcTransferReportFormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            options: buyers.data?.map((b) => ({ label: b.buyer_name, value: b.id.toString() })) ?? [],
            type: "select"
        },
        {
            name: 'lcId',
            label: "Select LC",
            placeholder: "Select LC, or leave blank for all",
            type: "select",
            options: LCs.map((lc) => ({ label: lc.lc_no, value: lc.id })),
        },
        {
            name: "factoryId",
            label: "Select Factory",
            type: "select",
            options: factories.map((fac) => ({ label: fac.name, value: fac.id })),
            optional: true
        },
    ]
}