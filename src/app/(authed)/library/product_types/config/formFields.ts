import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

type FormFieldParams = {
    checked: boolean | undefined;
}

export const formFields = ({  checked }: FormFieldParams): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Product Type Name",
            placeholder: "Enter product type name",
        },
        {
            name: "is_active",
            label: "Active",
            type: "toggle",
            checked: checked ?? true,
        },
    ];
}