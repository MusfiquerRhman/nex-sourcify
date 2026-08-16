import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery();

    return [
        {
            name: "terms_id",
            label: "Terms",
            options: terms.data?.map((t) => ({ label: t.name, value: t.id.toString() })) ?? [],
            type: "select",
        },
        {
            name: "tenor",
            label: "Tenor (in days)",
            placeholder: "Enter tenor in days",
            type: "number",
        },
        {
            name: "term_description",
            label: "Term Description",
            placeholder: "Enter term description",
            optional: true,
        },
    ];
}
