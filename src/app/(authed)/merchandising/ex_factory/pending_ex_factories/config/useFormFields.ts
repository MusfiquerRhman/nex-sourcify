import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: buyers.map((b) => ({ label: b.buyer_name, value: b.id.toString() })),
        },
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
        },
        {
            name: "from_date",
            label: "From Date",
            placeholder: "Select from date",
            type: "date",
        },
        {
            name: "to_date",
            label: "To Date",
            placeholder: "Select to date",
            type: "date",
        }
    ]
}