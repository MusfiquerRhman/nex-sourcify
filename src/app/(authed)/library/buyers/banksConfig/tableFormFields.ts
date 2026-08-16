import { api } from "~/trpc/react";
import type { FormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (): Field<keyof FormValues>[] => {
    const banks = api.banks.getAllBanks.useQuery();

    return [
        {
            name: "bank_id",
            label: "Bank ID",
            placeholder: "Enter bank ID",
            type: "select",
            options: banks.data ? banks.data.map((bank) => ({ label: bank.name, value: bank.id.toString() })): [],
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
        },
        {
            name: "address",
            label: "Address",
            placeholder: "Enter address",
            optional: true,
        },
    ];
}