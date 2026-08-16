import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const departments = api.departments.getDepartments.useQuery();

    return [
        {
            name: "name",   
            label: "TNA Action Name",
            placeholder: "Enter TNA Action name",
        },
        {
            name: "department_id",
            label: "Department",
            options: departments.data?.map((d) => ({ label: d.name, value: d.id.toString() })) ?? [],
            type: "select",
        },
        {
            name: "lead_time",
            label: "Lead Time (Days)",
            placeholder: "Enter lead time in days",
            type: "number",
        },
        {
            name: "alert_before",
            label: "Alert Before (Days)",
            placeholder: "Enter alert before in days",
            type: "number",
        },
    ];
};