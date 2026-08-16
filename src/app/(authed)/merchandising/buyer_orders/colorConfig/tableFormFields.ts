import { api } from "~/trpc/react";
import type { ColorFormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ColorFormValues> = BaseField<T>;

export const formFields = ({colors}: {colors: {id: number; name: string}[]}): Field<keyof ColorFormValues>[] => {
    return [
        {
            name: 'color_id',
            label: 'Color',
            placeholder: 'Select color',
            type: 'select',
            options: colors.map(color => ({
                label: color.name ?? '',
                value: color.id.toString(),
            })),
        },
        {
            name: 'quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            type: 'number',
        },
    ]
};
