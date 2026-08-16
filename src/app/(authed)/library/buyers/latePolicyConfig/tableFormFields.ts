import type { FormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "description",
            label: "Late Policy Description",
            placeholder: "Enter a late policy description",
        }
    ]
}