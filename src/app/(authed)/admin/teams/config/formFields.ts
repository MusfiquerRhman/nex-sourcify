import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();

    return [
        {
            name: "team_name",
            label: "Team Name",
            placeholder: "Enter team name",
        },
        {
            name: "buyer_id",
            label: "Buyer",
            options: buyers.data?.map((b) => ({ label: b.buyer_name, value: b.id.toString() })) ?? [],
            type: "select",
        },
    ];
}