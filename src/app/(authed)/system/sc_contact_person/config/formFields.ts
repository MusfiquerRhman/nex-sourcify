import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Contact Person Name",
            placeholder: "Enter contact person name",
        },
        {
            name: "contact_number",
            label: "Contact Number",
            placeholder: "Enter contact number",
        },
        {
            name: "pabx",
            label: "PABX",
            placeholder: "Enter PABX",
            optional: true,
        },
        {
            name: "ext",
            label: "Extension",
            placeholder: "Enter extension",
            type: "number",
            optional: true,
        },
        {
            name: "email",
            label: "Email",
            placeholder: "Enter email",
        },
    ];
};