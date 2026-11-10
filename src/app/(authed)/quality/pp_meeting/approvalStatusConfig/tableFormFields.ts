import type { ApprovalFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ApprovalFormValues> = BaseField<T>;

export const useTableFormFields = (): Field<keyof ApprovalFormValues>[] => {
    return [
        {
            name: "status_name",
            label: "Status",
            placeholder: "Enter Status",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "approval_status",
            label: "Approval Status",
            placeholder: "Select approval status",
            type: "select",
            options: [
                {label: 'YES', value: 1},
                {label: 'NO', value: 0},
                {label: 'N/A', value: -1}
            ],
        },
    ]
}

