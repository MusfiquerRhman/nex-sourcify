import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

type FormFieldParams = {
    checked: boolean | undefined;
}

export const formFields = ({  checked }: FormFieldParams): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();

    return [
        {
            name: "season_name",
            label: "Season Name",
            placeholder: "Enter season name",
        },
        {
            name: "buyer_id",
            label: "Buyer",
            options: buyers.data?.map((b) => ({ label: b.buyer_name, value: b.id.toString() })) ?? [],
            type: "select",
        },
        {
            name: "active_status",
            label: "Active",
            type: "toggle",
            checked: checked ?? true,
        },
    ];
};