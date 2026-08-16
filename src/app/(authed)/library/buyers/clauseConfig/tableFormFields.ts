import type { FormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "description",
            label: "Clause Description",
            placeholder: "Enter a clause description",
        }
    ]
}