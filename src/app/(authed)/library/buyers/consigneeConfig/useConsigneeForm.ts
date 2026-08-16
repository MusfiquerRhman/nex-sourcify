import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { formFields } from "./tableFormFields";
import { formSchema } from "./tableFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GetBuyerByIdTypes } from "~/types/libraryAPITypes";

type ConsigneeFormValues = {
  consignees: {
    id?: number; 
    db_id?: number;
    consignee_name: string;
    address: string;
  }[];
};

const consigneeFormSchema = z.object({
  consignees: z.array(formSchema),
});

export const useConsigneeForm = (consigneeData?: GetBuyerByIdTypes['consignee']) => {
    // Form setup
    const { reset, register, control, handleSubmit, formState: { errors: validationError }, trigger } = useForm<ConsigneeFormValues>({
        resolver: zodResolver(consigneeFormSchema),
        defaultValues: {
            consignees: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "consignees",
    });

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (consigneeData?.length) {
            reset({
                consignees: consigneeData.map((c: ConsigneeFormValues["consignees"][number]) => ({
                    db_id: c.id, // keep this for edit/delete
                    consignee_name: c.consignee_name,
                    address: c.address,
                })),
            });
        }
    }, [consigneeData, reset]);


    const addRow = () => {
        append({
            consignee_name: "",
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
        reset
    };
}