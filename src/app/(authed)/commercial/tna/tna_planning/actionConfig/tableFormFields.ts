import type { BaseField } from "~/types/form";
import type { TNAPlanningDetailsFormValues } from "../config/formSchema";
import { COMMERCIAL_DEPARTMENT_ID } from "~/utils/config";

export type Field<T extends keyof TNAPlanningDetailsFormValues> = BaseField<T>;

interface Props {
    action: string, 
    userDepartment: number | undefined, 
    isAdmin: boolean
}

const rules: Record<string, number> = {
    "ETD Date": COMMERCIAL_DEPARTMENT_ID,
    "GOODS HANDOVER DATE TO FORWARDER": COMMERCIAL_DEPARTMENT_ID,
    "BOOKING DATE": COMMERCIAL_DEPARTMENT_ID
};

export const formFields = (props: Props): Field<keyof TNAPlanningDetailsFormValues>[] => {
    const {action, userDepartment, isAdmin} = props;

    const allowActualDateEdit = userDepartment === rules[action] || isAdmin;
    const editableField = Object.keys(rules).includes(action);

    return [
        {
            name: "tna_action",   
            label: "TNA Action",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "plan_date",
            label: "Plan Date",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "actual_date",
            label: "Actual Date",
            type: "date",
            disabled: !(allowActualDateEdit && editableField),
            optional: true,
        },
    ];
}