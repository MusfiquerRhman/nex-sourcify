import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Courier Name",
            placeholder: "Enter courier name",
        },
        {
            name: "phone_no",
            label: "Phone Number",
            placeholder: "Enter phone number",
            optional: true,
        },
        {
            name: "email",
            label: "Email Address",
            placeholder: "Enter email address",
            optional: true,
        },
        {
            name: "contact_person",
            label: "Contact Person",
            placeholder: "Enter contact person",
            optional: true,
        },
        {
            name: "website",
            label: "Website",
            placeholder: "Enter website URL",
            optional: true,
        },
        {
            name: "address",
            label: "Address",
            placeholder: "Enter address",
            optional: true,
        },
    ];
}