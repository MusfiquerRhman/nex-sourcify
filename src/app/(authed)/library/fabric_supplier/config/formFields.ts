import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const countries = api.countries.getAll.useQuery();

    return [
        {
            name: "name",
            label: "Supplier Name",
            placeholder: "Enter supplier name",
        },
        {
            name: "phone_no",
            label: "Phone Number",  
            placeholder: "Enter phone number",
            optional: true,
        },
        {
            name: "email",
            label: "Email",
            placeholder: "Enter email",
            optional: true,
        },
        {
            name: "country_id",
            label: "Country",
            options: countries.data?.map((c) => ({ label: c.name, value: c.id.toString() })) ?? [],
            type: "select",
            optional: true,
        },
        {
            name: "address",
            label: "Address",
            placeholder: "Enter address",
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
            placeholder: "Enter website",
            optional: true,
        },
    ];
}
