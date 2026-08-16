import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    return [
        {
            name: "name",
            label: "Factory Name",
            placeholder: "Enter factory name",
        },
        {
            name: "prefix",
            label: "Short Name",
            placeholder: "Enter short name",
        },
        {
            name: "contact_person",
            label: "Contact Person",
            placeholder: "Enter contact person",
            optional: true,
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
            name: "office_address",
            label: "Office Address",
            placeholder: "Enter office address",
            optional: true,
        },
        {
            name: "factory_address",
            label: "Factory Address",
            placeholder: "Enter factory address",
            optional: true,
        },
        {
            name: "website",
            label: "Website",
            placeholder: "Enter website URL",
            optional: true,
        },
    ];
}
