import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { earlySettlementFormSchema } from "./formSchema";
import type { EarlySettlementFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import type { GetEarlySettlementPercentageByIdTypes } from "~/types/libraryAPITypes";

export const useEarlySettlementForm = (settlement?: any) => {
    // Form setup
    const methods = useForm<EarlySettlementFormValues>({
        resolver: zodResolver(earlySettlementFormSchema),
        defaultValues: {
            db_id: settlement?.id ?? undefined,
            order_id: settlement?.order_id ?? undefined,
            buyer_id: settlement?.buyer_id,
            remarks: settlement?.remarks ?? '',
            pos: settlement?.pos
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when percentage changes
    useEffect(() => {
        if (settlement) {
            methods.reset({
                db_id: settlement.id,
                order_id: settlement.order_id,
                buyer_id: settlement.buyer_id,
                remarks: settlement.remarks,
                pos: settlement?.pos
            });
        }
    }, [settlement, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof EarlySettlementFormValues);
    }, [validationError, setFocus]);

    const buyer_id = useWatch({ control: methods.control, name: `buyer_id`});

    const isEdit = !!settlement;

    return { methods, handleSubmit, formFields: useFormFields({isEdit, buyer_id}), validationError, control, reset };
}