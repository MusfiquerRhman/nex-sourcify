import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { formFields } from "./tableFormFields";
import { formSchema } from "./tableFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type PolicyValues = {
  policy: {
    id?: number; 
    description: string;
    db_id?: number;
  }[];
};

const policyFormSchema = z.object({
  policy: z.array(formSchema),
});

export const usePolicyForm = (policyData?: PolicyValues["policy"]) => {
    // Form setup
    const { reset, register, control, handleSubmit, formState: { errors: validationError }, trigger } = useForm<PolicyValues>({
        resolver: zodResolver(policyFormSchema),
        defaultValues: {
            policy: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "policy",
    });

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (policyData?.length) {
            reset({
                policy: policyData.map((b) => ({
                    db_id: b.id, // keep this for edit/delete
                    description: b.description,
                })),
            });
        }
    }, [policyData, reset]);


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