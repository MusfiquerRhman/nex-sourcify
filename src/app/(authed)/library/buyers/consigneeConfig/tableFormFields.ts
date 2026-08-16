import type { FormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "consignee_name",
            label: "Consignee Name",
            placeholder: "Enter consignee name",
        },
        {
            name: "address",
            label: "Address",
            placeholder: "Enter address",
        },
    ];
}
