import { api } from "~/trpc/react";
import type { OrderSummaryReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof OrderSummaryReportFormValues> = BaseField<T>;

interface PropsType {
    buyer_ids?: number[];
    brand_ids?: number[];
}

export const useFormFields = ({buyer_ids, brand_ids}: PropsType): Field<keyof OrderSummaryReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    const factories = [
        { id: -1, name: "All" },
        ...(api.factory.getAllFactories.useQuery().data ?? []),
    ]

    const brands = [
        { id: -1, brand: "All" },
        ...(api.buyers.getBrandsByBuyers.useQuery(
            !!buyer_ids?.length ? buyer_ids : skipToken
        ).data ?? []),
    ];

    const teams = [
        { id: -1, team_name: "All" },
        ...(api.teams.getTeamsByBuyers.useQuery(
            !!buyer_ids?.length ? buyer_ids ?? [] : skipToken
        ).data ?? []),
    ]

    const departments = [
        { id: -1, departments: "All" },
        ...(api.buyers.getDepartmentsByBrands.useQuery(
            brand_ids?.includes(-2) || !brand_ids?.length ? skipToken : brand_ids
        ).data ?? []),
    ];

    const seasons = [
        { id: -1, season_name: "All" },
        ...(api.seasons.getSeasonsByBuyers.useQuery(
            buyer_ids?.includes(-2) || !buyer_ids?.length ? skipToken : buyer_ids
        ).data ?? []),
    ];

    return [
        {
            name: "base",
            label: "Based On",
            type: "select",
            options: [
                {label: "Based on Actual Ex-Factory Date", value: "ACTUAL EXFACTORY"},
                {label: "Based on Ex-Factory Date", value: "EXFACTORY"},
                {label: "Based on ETD Date", value: "ETD"},
                {label: "Based on Handover Date", value: "HANDOVER"}
            ],
        },
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
            name: "season_ids",
            label: "Select Seasons",
            placeholder: "Select seasons, or leave blank for all",
            type: "multiselect",
            options: seasons.map((season) => ({ label: season.season_name, value: season.id.toString() })),
            optional: true,
        },
    ]
}