import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            options: buyers.data?.map((c) => ({ label: c.buyer_name, value: c.id.toString() })) ?? [],
            type: "select",
        },
        {
            name: "buffer",
            label: "Buffer (Days)",
            placeholder: "Enter buffer in days",
            type: "number",
        },
    ];
}