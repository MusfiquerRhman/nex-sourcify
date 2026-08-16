import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { formFields } from "./tableFormFields";
import { formSchema } from "./tableFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GetFactoryByIdTypes } from "~/types/libraryAPITypes";

type BankFormValues = {
  banks: {
    id?: number; 
    db_id?: number;
    bank_id: string;
    branch_name: string;
    account_no: string;
    account_name: string;
    swift_code?: string;
    address?: string;
  }[];
};

const bankFormSchema = z.object({
  banks: z.array(formSchema),
});

export const useFactoryBanksForm = (bankData?: GetFactoryByIdTypes['factoryBanks']) => {
    // Form setup
    const { reset, register, control, handleSubmit, formState: { errors: validationError }, trigger } = useForm<BankFormValues>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: {
            banks: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "banks",
    });

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (bankData?.length) {
            reset({
                banks: bankData.map(b => ({
                    db_id: b.id, // keep this for edit/delete
                    bank_id: String(b.bank_id ?? ''),
                    branch_name: b.branch_name ?? '',
                    account_no: b.account_no ?? '',
                    account_name: b.account_name ?? '',
                    swift_code: b.swift_code ?? '',
                    address: b.address ?? '',
                })),
            });
        }
    }, [bankData, reset]);


    const addRow = () => {
        append({
            bank_id: '',
            branch_name: "",
            account_no: "",
            account_name: "",
            swift_code: "",
            address: "",
        });
    }

    return {
        register,
        handleSubmit,
        fields,
        tableFormFields: formFields(),
        addRow,
        remove,
        validationError,
        trigger,
        control,
        reset
    };
}