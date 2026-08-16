import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { CrossPaymentFormSchema } from "./formSchema";
import type { CrossPaymentFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetCrossPaymentByIdTypes } from "~/types/accountingAPITypes";
import { safeNumber } from "~/utils/numbers";
import { quantityFormatter } from "~/utils/localNumberStrings";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

type CrossPaymentsType = NonNullable<GetCrossPaymentByIdTypes>;

type CrossPaymentDetailsType = CrossPaymentsType['cross_payment_details'][number];

export const useCrossPaymentForm = (initialData?: CrossPaymentsType) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id ?? undefined,
            cross_payment_ref: initialData.cross_payment_ref ?? undefined,
            term_id: initialData.term_id ?? undefined,
            buyer_id: initialData.buyer_id ?? undefined,
            cross_payment_date: initialData.cross_payment_date 
                ? formatDateForInput(initialData.cross_payment_date) 
                : undefined,
            remarks: initialData.remarks ?? undefined,
            details: initialData.cross_payment_details?.map((detail: CrossPaymentDetailsType) => ({
                db_id: detail.id ?? undefined,
                factory_invoice_id: detail.factory_invoice_id ?? undefined,
                factory_invoice_no: detail.factory_invoice?.invoice_no ?? undefined,
                factory_payment_no: detail.factory_payment_no ?? undefined,
                factory_payment_date: detail.factory_payment_date 
                    ? formatDateForInput(detail.factory_payment_date) 
                    : undefined,
                value: detail.value ?? undefined,
                regularized: detail.regularized ? 'REGULARIZED' : 'NOT REGULARIZED',
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<CrossPaymentFormValues>({
        resolver: zodResolver(CrossPaymentFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_id: undefined,
            buyer_id: undefined,
            cross_payment_date: formatDateForInput(new Date()),
            remarks: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const isEdit = !!initialData;

    return {
        methods,
        handleSubmit,
        formFields: useFormFields({isEdit}),
        validationError,
        trigger,
        watch,
        control,
    };
}
