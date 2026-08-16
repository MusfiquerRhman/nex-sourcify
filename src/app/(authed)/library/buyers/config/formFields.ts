import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const countries = api.countries.getAll.useQuery();
    const overseasOffice = api.overseasOffices.getAllOverseasOffices.useQuery();
    const paymentTerms = api.paymentTerms.getAll.useQuery({});
    const destinations = api.destinations.getAll.useQuery();

    return [
        {
            name: "buyer_name",
            label: "Buyer Name",
            placeholder: "Enter buyer name",
        },
        {
            name: "short_name",
            label: "Short Name",
            placeholder: "Enter short name",
        },
        {
            name: "prefix",
            label: "Prefix",
            placeholder: "Enter prefix",
        },
        {
            name: "address",
            label: "Address",
            placeholder: "Enter address",
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
            name: "country_id",
            label: "Country",
            options: countries.data?.map((c) => ({ label: c.name, value: c.id.toString() })) ?? [],
            type: "select",
            optional: true,
        },
        {
            name: "overseas_office_id",
            label: "Overseas Office",
            options: overseasOffice.data?.map((o) => ({ label: o.name, value: o.id.toString() })) ?? [],
            type: "select",
            optional: true,
        },
        {
            name: 'paymentTerms',
            label: 'Payment Terms',
            options: paymentTerms.data?.map((pt) => ({ 
                label: `${pt.terms.name} - ${pt.tenor} ${pt.term_description}`, 
                value: pt.id.toString() 
            })) ?? [],
            type: 'multiselect',
            optional: true,
        },
        {
            name: 'destinations',
            label: 'Destinations',
            options: destinations.data?.map((d) => ({ label: d.name ?? '', value: d.id.toString() })) ?? [],
            type: 'multiselect',
            optional: true,
        }
    ];
}