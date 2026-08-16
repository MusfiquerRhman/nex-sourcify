import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const countries = api.countries.getAll.useQuery();

    return [
        {
            name: "name",
            label: "Bank Name",
            placeholder: "Enter bank name",
        },
        {
            name: "country_id",
            label: "Country",
            options: countries.data?.map((c) => ({ label: c.name, value: c.id.toString() })) ?? [],
            optional: true,
            type: "select",
        },
    ];
}