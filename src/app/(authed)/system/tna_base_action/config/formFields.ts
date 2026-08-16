import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { ETD_DATE_DB_ID, HANDOVER_DATE_DB_ID } from "~/utils/config";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (id?: string): Field<keyof FormValues>[] => {
    const buyers = api.tnaBaseAction.getBuyersForTnaBaseAction.useQuery(id);
    const tnaBaseAction = [
        { label: "ETD DATE", VALUE: ETD_DATE_DB_ID }, 
        { label: "HANDOVER DATE", VALUE: HANDOVER_DATE_DB_ID },
    ]

    return [
        {
            name: "buyer_id",   
            label: "Buyer",
            placeholder: "Enter Buyer",
            options: buyers.data?.map((c) => ({ label: c.buyer_name, value: c.id.toString() })) ?? [],
            type: "select",
        },
        {
            name: "action_id",
            label: "TNA Action",
            options: tnaBaseAction.map((t) => ({ label: t.label, value: t.VALUE.toString() })) ?? [],
            type: "select",
        },
    ];
};