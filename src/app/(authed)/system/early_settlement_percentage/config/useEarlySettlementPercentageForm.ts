import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetEarlySettlementPercentageByIdTypes } from "~/types/libraryAPITypes";
import { api } from "~/trpc/react";

export const useEarlySettlementPercentageForm = (settlement?: GetEarlySettlementPercentageByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            db_id: settlement?.id ?? undefined,
            buyer_id: settlement?.buyer_id ? settlement.buyer_id : -1,
            buyer_name: settlement?.buyer_name,
            charge: settlement?.charge ?? 0,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when percentage changes
    useEffect(() => {
        if (settlement) {
            methods.reset({
                db_id: settlement.id,
                buyer_id: settlement.buyer_id ? settlement.buyer_id : -1,
                charge: settlement.charge ?? 0,
            });
        }
    }, [settlement, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const isEdit = !!settlement;

    const buyers = api.earlySettlementPercentage.getBuyersForEarlySettlementPercentage.useQuery().data ?? [];

    let availableBuyer: {id: number, buyer_name: string}[] = [];

    if (isEdit) {
        availableBuyer = [{ 
            id: settlement?.buyer_id ?? -1, 
            buyer_name: settlement?.buyer_name ?? "" 
        }];
    }
    else {
        availableBuyer = buyers;
    }

    return { methods, handleSubmit, formFields: formFields({isEdit, buyers: availableBuyer}), validationError, control, reset };
}