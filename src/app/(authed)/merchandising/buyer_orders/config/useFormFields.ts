import { api } from "~/trpc/react";
import type { OrderFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof OrderFormValues['order']> = BaseField<T>;

type Props = {
    buyerID: number;
    brandID: number;
}

export const useFormFields = ({buyerID, brandID}: Props): Field<keyof OrderFormValues['order']>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    const factories = api.factory.getAllFactories.useQuery().data ?? [];
    
    const fobType = api.fobTypes.getAll.useQuery().data ?? [];

    const { data: seasons = [] } = api.seasons.getSeasonsByBuyer.useQuery(
        !!buyerID ? buyerID : skipToken
    );

    const { data: teams = [] } = api.teams.getTeamsByBuyer.useQuery(
        !!buyerID ? buyerID : skipToken
    );

    const { data: brands = [] } = api.buyers.getBrandsByBuyer.useQuery(
        !!buyerID ? buyerID : skipToken
    );

    const { data: departments = [] } = api.buyers.getDepartmentsByBrand.useQuery(
        !!brandID ? brandID : skipToken
    );

    const { data: currencies = [] } = api.currencies.getAll.useQuery();

    return [
        {
            name: "ref_no",
            label: "Reference Number (Auto Generated)",
            placeholder: "Enter reference number",
            disabled: true,
            optional: true,
        },
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: buyers.map((b) => ({ label: b.buyer_name, value: b.id.toString() })),
        },
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
        },
        {
            name: 'order_date',
            label: 'Order Date',
            placeholder: 'Select order date',
            type: 'date',
        },
        {
            name: "season_id",
            label: "Season",
            placeholder: "Select season",
            type: "select",
            options: seasons.map((s) => ({ label: s.season_name, value: s.id.toString() })),
        },
        {
            name: "fob_type_id",
            label: "FOB Type",
            placeholder: "Select FOB type",
            type: "select",
            options: fobType.map((f) => ({ label: f.name, value: f.id.toString() })),
        },
        {
            name: "team_id",
            label: "Team",
            placeholder: "Select team",
            type: "select",
            options: teams.map((t) => ({ label: t.team_name, value: t.id.toString() })),
        },
        {
            name: "brand_id",
            label: "Brand",
            placeholder: "Select brand",
            type: "select",
            options: brands.map((b) => ({ label: b.brand, value: b.id.toString() })),
        },
        {
            name: "department_id",
            label: "Department",
            placeholder: "Select department",
            type: "select",
            options: departments.map((d) => ({ label: d.department, value: d.id.toString() })),
        },
        {
            name: "secondary_currency_id",
            label: "Secondary Currency",
            placeholder: "Select secondary currency",
            type: "select",
            optional: true,
            options: currencies.map((c) => ({ label: c.name ?? '', value: c.id.toString() })),
        },
        {
            name: "currency_rate",
            label: "Currency Rate",
            placeholder: "Enter currency rate",
            type: "number",
            optional: true,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
        {
            name: 'status',
            label: 'Open Status',
            type: 'select',
            options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'Cancelled', value: 'CANCELLED' },
            ]
        }
    ]
}