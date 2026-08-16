import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

// Generate dynamic form configuration
export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Currency Name",
            placeholder: "Enter currency name"
        },
        {
            name: "symbol",
            label: "Currency Symbol",
            placeholder: "Enter currency symbol"
        },
        {
            name: 'currency_code',
            label: 'Currency Code',
            placeholder: 'Enter currency code',
            optional: true,
        }
    ];
}