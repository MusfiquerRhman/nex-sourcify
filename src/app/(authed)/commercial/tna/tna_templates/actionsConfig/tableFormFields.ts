import { api } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import type { TnaActionFormValues } from "../config/formSchema";

export type Field<T extends keyof TnaActionFormValues> = BaseField<T>;

type Props = {
    index: number;
}

export const useFormFields = ({ index }: Props): Field<keyof TnaActionFormValues>[] => {
    const { data: actions} = api.tnaActions.getAllTnaActions.useQuery({
        department_id: 2
    });

    return [
        {
            name: "action_id",
            label: "Action",
            type: "select",
            options:  actions?.map(action => ({ 
                value: action.id.toString(), 
                label: action.name 
            })) ?? [],
            placeholder: "Select Action",
        },
        {
            name: "days",
            label: "Days",
            type: "number",
            placeholder: "Enter number of days",
        },
        {
            name: "alert_before",
            label: "Alert Before (Days)",
            type: "number",
            placeholder: "Enter number of days to alert before",
        },
    ];
}