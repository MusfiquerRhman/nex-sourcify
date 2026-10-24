import { api } from "~/trpc/react";
import type { NotificationFiltersValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof NotificationFiltersValues> = BaseField<T>;

export const useFormFields = () => {
    const { data, isPending, error, refetch } = api.notifications.getFilterOptions.useQuery();

    const fields: Field<keyof NotificationFiltersValues>[] = [
        {
            name: "module_id",
            label: "Module",
            type: "select",
            options: [{ label: "All modules", value: 0 }, ...(data?.modules.map((module) => ({ label: module.name, value: module.id })) ?? [])],
            optional: true,
        },
        {
            name: "from_date",
            label: "From Date",
            type: "date",
            optional: true,
        },
        {
            name: "to_date",
            label: "To Date",
            type: "date",
            optional: true,
        },
        {
            name: "recipients_ids",
            label: "Recipients",
            placeholder: "Select recipients, or leave blank for all",
            type: "multiselect",
            options:
                data?.recipients.map((recipient) => ({
                    label: `${[recipient.first_name, recipient.last_name].filter(Boolean).join(" ")} - ${recipient.user_id}`,
                    value: recipient.id,
                })) ?? [],
            optional: true,
        },
        {
            name: "level_id",
            label: "Recipient Level",
            type: "select",
            options: [{ label: "All levels", value: 0 }, ...(data?.levels.map((level) => ({ label: level.name, value: level.id })) ?? [])],
            optional: true,
        },
        {
            name: "department_id",
            label: "Recipient Department",
            type: "select",
            options: [
                { label: "All departments", value: 0 },
                ...(data?.departments.map((department) => ({ label: department.name, value: department.id })) ?? []),
            ],
            optional: true,
        },
    ];

    return { fields, isLoading: isPending, error, refetch };
};
