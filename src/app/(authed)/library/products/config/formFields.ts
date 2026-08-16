import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

type FormFieldParams = {
    checked: boolean | undefined;
}

export const formFields = ({ checked }: FormFieldParams): Field<keyof FormValues>[] => {
    const productTypes = api.productType.getAll.useQuery();

    return [
        {
            name: "name",
            label: "Product Name",
            placeholder: "Enter product name",
        },
        {
            name: "product_type_id",
            label: "Product Type",
            placeholder: "Select product type",
            options: productTypes.data?.map(pt => ({ 
                value: pt.id.toString(), 
                label: pt.name 
            })) ?? [],
            type: "select",
        },
        {
            name: "is_active",
            label: "Active",
            type: "toggle",
            checked: checked ?? true,
        },
    ];
};