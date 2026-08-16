import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { useDecodedUser } from "~/hooks";

export type Field<T extends keyof FormValues> = BaseField<T>;

const departmentActionRules: Record<number, (actionName: string) => boolean> = {
    // Merchandising
    1: (name) => !["PP MEETING DATE", "HANDOVER DATE", "ETD DATE"].includes(name),

    // Commercial
    2: (name) => ["HANDOVER DATE", "ETD DATE"].includes(name),

    // Quality
    4: (name) => name === "PP MEETING DATE",
};

export const useFormFields = (): Field<keyof FormValues>[] => {
    const { data: actions = [] } = api.tnaActions.getAllTnaActions.useQuery({
        department_id: 1,
    });

    const user = useDecodedUser().user;

    const departmentId = Number(user?.department_id);

    const { isAdmin } = useDecodedUser();

    const allowedActions = (() => {
        if (isAdmin) return actions;

        const rule = departmentActionRules[departmentId];

        if (!rule) return [];

        return actions.filter((action) => rule(action.name));
    })();

    return [
        {
            name: "from_date",
            label: "From Date",
            placeholder: "Select from date",
            type: "date",
        },
        {
            name: "to_date",
            label: "To Date",
            placeholder: "Select to date",
            type: "date",
        },
        {
            name: "event_ids",
            label: "TNA Events",
            placeholder: "Select TNA Events, Not selecting any will include all events",
            type: "multiselect",
            options: allowedActions?.map(action => ({
                label: action.name,
                value: action.id,
            })) || [],
        }
    ]
}