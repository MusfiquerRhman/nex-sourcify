import type { BaseField } from "~/types/form";
import type { CrossPayReportFormValues } from "./formSchema";
import { api } from "~/trpc/react";

export const useFormFields = (): BaseField<keyof CrossPayReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "buyer_ids",
            label: "Select Buyers",
            placeholder: "Select buyers, or leave blank for all",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            optional: true,
        },
        {
            name: "factory_ids",
            label: "Select Factories",
            placeholder: "Select factories, or leave blank for all",
            type: "multiselect",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
            optional: true,
        },
        {
            name: "cross_pay_from",
            label: "Cross Payment From Date",
            type: "date",
            optional: true,
        },
        {
            name: "cross_pay_to",
            label: "Cross Payment To Date",
            type: "date",
            optional: true,
        },
        {
            name: "factory_pay_from",
            label: "Factory Payment From Date",
            type: "date",
            optional: true,
        },
        {
            name: "factory_pay_to",
            label: "Factory Payment To Date",
            type: "date",
            optional: true,
        },
    ];
}
    