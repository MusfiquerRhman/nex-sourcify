import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { earlySettlementFormSchema } from "./formSchema";
import type { EarlySettlementFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import type { GetEarlySettlementByIdTypes } from "~/types/merchandisingAPITypes";

export const useEarlySettlementForm = (settlement?: GetEarlySettlementByIdTypes) => {
    // Form setup
    const methods = useForm<EarlySettlementFormValues>({
        resolver: zodResolver(earlySettlementFormSchema),
        defaultValues: {
            db_id: settlement?.id ?? undefined,
            order_id: settlement?.order_id ?? undefined,
            buyer_id: settlement?.buyer_id,
            remarks: settlement?.remarks ?? '',
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Refresh the settlement fields without clearing PO rows being hydrated separately.
    useEffect(() => {
        if (settlement) {
            methods.reset({
                db_id: settlement.id,
                order_id: settlement.order_id,
                buyer_id: settlement.buyer_id,
                remarks: settlement.remarks ?? undefined,
                pos: methods.getValues('pos') ?? [],
            });
        }
    }, [settlement, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof EarlySettlementFormValues);
    }, [validationError, setFocus]);

    const buyer_id = useWatch({ control: methods.control, name: `buyer_id`});

    const early_settlement_id = useWatch({ control: methods.control, name: `db_id`});

    const isEdit = !!settlement;

    return { 
        methods, 
        handleSubmit, 
        formFields: useFormFields({
            isEdit, 
            buyer_id, 
            early_settlement_id
        }), 
        validationError, 
        control, 
        reset 
    };
}