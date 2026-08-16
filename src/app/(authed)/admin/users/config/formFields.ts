import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

type FormFieldParams = {
    checked: boolean | undefined;
}

// Generate dynamic form configuration
export const formFields = ({  checked }: FormFieldParams): Field<keyof FormValues>[] => {
    const levels = api.levels.getLevels.useQuery();
    const departments = api.departments.getDepartments.useQuery();

     return [
        { 
            name: "first_name", 
            label: "First Name", 
            placeholder: "Must be at least 4 characters long" 
        },
        { 
            name: "last_name", 
            label: "Last Name", 
            placeholder: "Last Name (optional)", 
            optional: true 
        },
        { 
            name: "user_id", 
            label: "User Name", 
            placeholder: "Must be at least 4 characters long" 
        },
        {
            name: "department_id",
            label: "Department",
            options: departments.data?.map((d) => ({ label: d.name, value: d.id })) ?? [],
            type: "select",
        },
        { 
            name: "password", 
            label: "Password", 
            placeholder: "Must be at least 6 characters long",
        },
        { 
            name: "confirmPassword", 
            label: "Confirm Password", 
            placeholder: "Must be at least 6 characters long",
        },
        {
            name: "phone_no",
            label: "Phone Number",
            placeholder: "Must be at least 11 characters long (optional)",
            type: "tel",
        },
        {
            name: "email",
            label: "Email address",
            placeholder: "Enter an email address (optional)",
            type: "email",
        },
        {
            name: "level_id",
            label: "User level",
            options: levels.data?.map((lvl) => ({ label: lvl.name, value: lvl.id })) ?? [],
            type: "select",
        },
        {
            type: "toggle",
            name: "is_active",
            label: "Active Status",
            checked: checked ?? true,
        },
    ];
}