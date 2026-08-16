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
            label: "Company Name",
            placeholder: "Enter company name",
        },
        {
            name: "country_id",
            label: "Country",
            options: countries.data?.map(country => ({ 
                value: country.id, 
                label: country.name 
            })) ?? [],
            type: "select",
        },
        {
            name: "currencies_id",
            label: "Currency",
            options: currencies.data?.map(currency => ({ 
                value: currency.id, 
                label: currency.name ?? "" 
            })) ?? [],
            type: "select",
        },
        {
            name: "email",
            label: "Email Address",
            placeholder: "Enter email address",
            optional: true,
        },
        {
            name: "phone_no",
            label: "Phone Number",
            placeholder: "Enter phone number",
            optional: true,
        },
        {
            name: "street",
            label: "Street",
            placeholder: "Enter street",
            optional: true,
        },
        {
            name: "city",
            label: "City",
            placeholder: "Enter city",
            optional: true,
        },  
        {
            name: "zip_code",
            label: "ZIP Code",
            placeholder: "Enter ZIP code",
            optional: true,
        },
    ];
}



