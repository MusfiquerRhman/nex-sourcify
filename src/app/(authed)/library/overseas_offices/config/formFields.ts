import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const currencies = api.currencies.getAll.useQuery();
    const countries = api.countries.getAll.useQuery();

    return [
        {
            name: "name",
            label: "Office Name",
            placeholder: "Enter office name",
        },
        {
            name: "country_id",
            label: "Country",
            options: countries.data?.map((c) => ({ label: c.name, value: c.id.toString() })) ?? [],
            type: "select",
            optional: true,
        },
        {
            name: "currency_id",
            label: "Currency",
            options: currencies.data?.map((c) => ({ label: c.name ?? "", value: c.id.toString() })) ?? [],
            type: "select",
            optional: true,
        },
        {
            name: "phone_no",   
            label: "Phone Number",
            placeholder: "Enter phone number",
            optional: true,
        },
        {
            name: "email_address",
            label: "Email Address",
            placeholder: "Enter email address",
            optional: true,
        },
        {
            name: "city",
            label: "City",
            placeholder: "Enter city",
            optional: true,
        },
        {
            name: "street",
            label: "Street",
            placeholder: "Enter street",
            optional: true,
        },
        {
            name: "zip",
            label: "ZIP Code",
            placeholder: "Enter ZIP code",
            optional: true,
        },
    ];
}