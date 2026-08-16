import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

interface PropsType {
    isEdit?: boolean;
    salesContracts: { id: string; sales_contract_no: string }[];
}

export const formFields = ({ isEdit, salesContracts}: PropsType): Field<keyof FormValues>[] => {
    const { data: factories } = api.factory.getAllFactories.useQuery();

    return [
        {
            name: 'factory_id',
            label: 'Factory',
            type: 'select',
            options: factories ? factories.map(factory => ({
                label: factory.name,
                value: factory.id.toString()
            })) : [],
            disabled: isEdit, // Disable selection in edit mode
            optional: isEdit,
        },
        {
            name: 'sales_contract_id',
            label: 'Sales Contract No',
            type: 'select',
            options: salesContracts ? salesContracts.map(contract => ({
                label: contract.sales_contract_no,
                value: contract.id
            })) : [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'amendment_date',
            label: 'Amendment Date',
            type: 'date',
            optional: true,
        },
        {
            name: 'amendment_no',
            label: 'Amendment No',
            optional: true,
            disabled: true, // This will be auto-generated, so it should be disabled
        },
        {
            name: 'remarks',
            label: 'Remarks',
            type: 'textarea',
        }
    ];
};