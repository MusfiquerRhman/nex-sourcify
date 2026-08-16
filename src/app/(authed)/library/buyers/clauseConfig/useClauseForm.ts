import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { formFields } from "./tableFormFields";
import { formSchema } from "./tableFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GetBuyerByIdTypes } from "~/types/libraryAPITypes";

type ClauseValues = {
  clause: {
    id?: number; 
    description: string;
    db_id?: number;
  }[];
};

const clauseFormSchema = z.object({
  clause: z.array(formSchema),
});

export const useClauseForm = (clauseData?: GetBuyerByIdTypes['clause']) => {
    // Form setup
    const { reset, register, control, handleSubmit, formState: { errors: validationError }, trigger } = useForm<ClauseValues>({
        resolver: zodResolver(clauseFormSchema),
        defaultValues: {
            clause: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "clause",
    });

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (clauseData?.length) {
            reset({
                clause: clauseData.map((b: ClauseValues["clause"][number]) => ({
                    db_id: b.id, // keep this for edit/delete
                    description: b.description,
                })),
            });
        }
    }, [clauseData, reset]);


    const addRow = () => {
        append({
            description: ""
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
        reset
    };
}