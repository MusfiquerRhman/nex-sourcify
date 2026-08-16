import { api } from "~/trpc/react";
import type { ExportReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof ExportReportFormValues> = BaseField<T>;

interface PropsType {
    buyer_ids?: number[];
    brand_ids?: number[];
}

export const useFormFields = ({buyer_ids, brand_ids}: PropsType): Field<keyof ExportReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    const factories = [
        { id: -1, name: "All" },
        { id: -2, name: "None" },
        ...(api.factory.getAllFactories.useQuery().data ?? []),
    ]

    const brands = [
        { id: -1, brand: "All" },
        { id: -2, brand: "None" },
        ...(api.buyers.getBrandsByBuyers.useQuery(
            !!buyer_ids?.length ? buyer_ids : skipToken
        ).data ?? []),
    ];

    const teams = [
        { id: -1, team_name: "All" },
        { id: -2, team_name: "None" },
        ...(api.teams.getTeamsByBuyers.useQuery(
            !!buyer_ids?.length ? buyer_ids ?? [] : skipToken
        ).data ?? []),
    ]

    const departments = [
        { id: -1, departments: "All" },
        { id: -2, departments: "None" },
        ...(api.buyers.getDepartmentsByBrands.useQuery(
            brand_ids?.includes(-2) || !brand_ids?.length ? skipToken : brand_ids
        ).data ?? []),
    ];

    const productTypes = [
        { id: -1, name: "All" },
        { id: -2, name: "None" },
        ...(api.productType.getAll.useQuery(
            brand_ids?.includes(-2) || !brand_ids?.length ? skipToken : undefined
        ).data ?? []),
    ];


    return [
        {
            name: "from_date",
            label: "From Date",
            type: "date",
            optional: true
        },
        {
            name: "to_date",
            label: "To Date",
            type: "date",
            optional: true
        },
        {
            name: "buyer_ids",
            label: "Select Buyers",
            placeholder: "Select buyers, or leave blank for all",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            optional: true,
        },
        {
            name: "factory_ids",
            label: "Select Factories",
            placeholder: "Select factories, or leave blank for all",
            type: "multiselect",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
            optional: true,
        },
        {
            name: "brand_ids",
            label: "Select Brands",
            placeholder: "Select brands, or leave blank for all",
            type: "multiselect",
            options: brands.map((pt) => ({ label: pt.brand, value: pt.id.toString() })),
            optional: true,
        },
        {
            name: "department_ids",
            label: "Select Departments",
            placeholder: "Select departments, or leave blank for all",
            type: "multiselect",
            options: departments.map((dept) => ({ label: dept.departments, value: dept.id.toString() })),
            optional: true,
        },
        {
            name: "team_id",
            label: "Select Teams",
            placeholder: "Select teams, or leave blank for all",
            type: "multiselect",
            options: teams.map((team) => ({ label: team.team_name, value: team.id.toString() })),
            optional: true,
        },
        {
            name: "product_type_ids",
            label: "Select Product Types",
            placeholder: "Select product types, or leave blank for all",
            type: "multiselect",
            options: productTypes.map((pt) => ({ label: pt.name, value: pt.id.toString() })),
            optional: true,
        },
        {
            name: 'quantity',
            label: 'Quantity',
            type: "checkbox",
            optional: true
        },
        {
            name: 'rdl_value',
            label: 'Value',
            type: "checkbox",
            optional: true
        },
        {
            name: 'factory_value',
            label: 'Factory Value',
            type: "checkbox",
            optional: true
        },
        {
            name: 'commission_value',
            label: 'Commission Value',
            type: "checkbox",
            optional: true
        }
    ]
}