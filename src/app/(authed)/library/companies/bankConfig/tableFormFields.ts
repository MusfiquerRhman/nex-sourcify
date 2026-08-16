import { api } from "~/trpc/react";
import type { FormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const banks = api.banks.getAllBanks.useQuery();

    return [
        {
            name: "bank_id",
            label: "Bank Name",
            placeholder: "Enter bank name",
            type: "select",
            options: banks.data?.map((b) => ({ label: b.name, value: b.id.toString() })) ?? [],
        },
        {
            name: "branch_name",
            label: "Branch Name",
            placeholder: "Enter branch name",
        },
        {
            name: "account_no",
            label: "Account Number",
            placeholder: "Enter account number",
        },
        {
            name: "account_name",
            label: "Account Name",
            placeholder: "Enter account name",
        },
        {
            name: "swift",
            label: "SWIFT Code",
            placeholder: "Enter SWIFT code",
            optional: true,
        },
        {
            name: "address",
            label: "Bank Address",
            placeholder: "Enter bank address",
            optional: true,
        },
    ];
}