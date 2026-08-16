import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

// Generate dynamic form configuration
export const formFields = (): Field<keyof FormValues>[] => {
    return [
        { 
            name: "name", 
            label: "Country Name",
            placeholder: "Enter country name" 
        },
        {
            name: "country_code",
            label: "Country Code",
            placeholder: "Enter country code",
            optional: true,
        },
    ];
}