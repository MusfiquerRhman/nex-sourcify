import type { BaseField } from "~/types/form";
import type { FormValues } from "./formSchema";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Color Name",
            placeholder: "Enter color name",
        },
    ];
}