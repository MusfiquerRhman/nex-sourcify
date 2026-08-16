import type { TNAPlanningFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof TNAPlanningFormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof TNAPlanningFormValues>[] => {
    return [
        {
            name: "factory_invoice",
            label: "Invoice No",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: 'tna_template',
            label: 'TNA Template',
            type: "text",
            disabled: true,
            optional: true,
        },
    ]
}