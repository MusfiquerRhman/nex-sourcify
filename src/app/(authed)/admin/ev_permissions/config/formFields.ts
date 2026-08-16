import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (isEdit: boolean): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAll.useQuery();
    const users = api.users.getAllUsers.useQuery();

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyers.data?.map((buyer) => ({
                value: buyer.id,
                label: buyer.buyer_name,
            })) || [],
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "user_id",
            label: "User",
            type: "select",
            options: users.data?.map((user) => ({
                value: user.id,
                label: user.user_id,
            })) || [],
        },
    ];
};