import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const productTypes = api.productType.getAll.useQuery();

    return [
        {
            name: "description",
            label: "Description",
            placeholder: "Enter description",
        },
        {
            name: "composition",
            label: "Composition",
            placeholder: "Enter composition",
        },
        {
            name: "value",
            label: "Value",
            placeholder: "Enter value",
            type: "number",
        },
        {
            name: "unit",
            label: "Unit",
            placeholder: "Enter unit",
            type: 'select',
            options: [
                { label: 'GSM', value: 'GSM' },
                { label: 'GG', value: 'GG' },
                { label: 'OZ/YD²', value: 'OZ/YD²' },
            ],
        },
        {
            name: "name",
            label: "Fabric Name",
            placeholder: "Enter fabric name",
            disabled: true,
            optional: true
        },
        {
            name: "product_type_id",
            label: "Product Type",
            placeholder: "Select product type",
            type: "select",
            options: productTypes.data?.map((type) => ({ label: type.name, value: type.id })) ?? [],
        },
    ];
};