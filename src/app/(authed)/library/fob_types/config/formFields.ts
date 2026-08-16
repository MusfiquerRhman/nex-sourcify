import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Fob Type",
            placeholder: "Enter Fob Type",
        },
    ];
};