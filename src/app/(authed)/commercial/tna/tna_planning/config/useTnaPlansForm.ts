import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { tnaPlanningSchema } from "./formSchema";
import type { TNAPlanningFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import type { GetTNAPlanByIdTypes } from "~/types/commercialAPITypes";

type TNAActionsDetails = NonNullable<GetTNAPlanByIdTypes>['details'][number];

export const useTnaPlansForm = (initialData?: GetTNAPlanByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            factory_invoice: initialData.factory_invoice ?? undefined,
            tna_template: initialData.tna_template ?? undefined,
            details: initialData.details?.map((detail: TNAActionsDetails) => ({
                db_id: detail.id,
                tna_action: detail.action ?? undefined,
                plan_date: detail?.plan_date ? formatDate(detail.plan_date) : undefined,
                actual_date: detail?.actual_date ? formatDateForInput(detail?.actual_date) : undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<TNAPlanningFormValues>({
        resolver: zodResolver(tnaPlanningSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            factory_invoice: undefined,
            tna_template: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const formFields = useFormFields();

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}