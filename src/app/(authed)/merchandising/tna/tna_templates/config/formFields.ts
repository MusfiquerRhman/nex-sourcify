import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof FormValues> = BaseField<T>;

type Props = {
    buyer_id?: number;
};

export const formFields = ({buyer_id}: Props): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery();
    const teams = api.teams.getTeamsByBuyer.useQuery(!!buyer_id ? buyer_id : skipToken);

    return [
        {
            name: "template_name",
            label: "Template Name",
            type: "text",
            placeholder: "Enter template name",
        },
        {   
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyers.data?.map(buyer => ({ 
                value: buyer.id.toString(), 
                label: buyer.buyer_name 
            })) ?? [],
            placeholder: "Select Buyer",
        },
        {
            name: "team_id",
            label: "Team",
            type: "select",
            options: teams.data?.map(team => ({ 
                value: team.id.toString(), 
                label: team.team_name 
            })) ?? [],
            placeholder: "Select Team",
        }
    ];
};