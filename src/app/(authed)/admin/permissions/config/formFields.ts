import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

// Generate dynamic form configuration
export const formFields = (): Field<keyof FormValues>[] => {
    const levels = api.levels.getLevels.useQuery();
    const departments = api.departments.getDepartments.useQuery();

    return [
        {
            name: "level_id",
            label: "Level",
            type: "select",
            options: levels.data?.map((level) => ({
                label: level.name,
                value: level.id,
            })) ?? [],
        },
        {   
            name: "department_id",
            label: "Department",
            type: "select",
            options: departments.data?.map((department) => ({
                label: department.name,
                value: department.id,
            })) ?? [],
        },
    ];
}