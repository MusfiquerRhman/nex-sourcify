import { api } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import type { TableFormValues } from "./tableFormSchema";

export type Field<T extends keyof TableFormValues> = BaseField<T>;

export const formFields = (): Field<keyof TableFormValues>[] => {
    const users = api.users.getAllUsers.useQuery();

    return [
        {
            name: "user_id",
            label: "Member",
            placeholder: "Select a member",
            type: "select",
            options: users.data?.map((user) => ({
                label: user.user_id ?? '',
                value: user.id.toString(),
            })) ?? [],
        },
        {
            name: "department_name",
            label: "Department",
            placeholder: "Enter department",
            disabled: true,
        },
        {
            name: "level_name",
            label: "Level",
            placeholder: "Enter level",
            disabled: true,
        },
    ];
}

