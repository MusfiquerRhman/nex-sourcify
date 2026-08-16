import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { crossPaymentFormFields } from "./tableFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import type { GetCrossPaymentDetailsByIdTypes, GetFactoryPaymentByIdTypes } from "~/types/accountingAPITypes";
import { safeNumber } from "~/utils/numbers";
import { CrossPaymentFormSchema, type CrossPaymentFormValues } from "./formSchema";

type FactoryInvoiceTypes = NonNullable<GetCrossPaymentDetailsByIdTypes>['details'][number];

export const useCrossPaymentForm = (initialData?: GetCrossPaymentDetailsByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            details: initialData.details?.map((detail: FactoryInvoiceTypes) => ({
                factory_invoice_id: detail.factory_invoice_id ?? undefined,
                factory_invoice_no: detail.factory_invoice_no ?? undefined,
                factory_name: detail.factory_name ?? undefined,
                factory_payment_no: detail.factory_payment_no ?? undefined,
                factory_payment_detail_id: detail.factory_payment_detail_id ?? undefined,
                paid_amount: safeNumber(detail.paid_amount) ?? undefined,
                regularized: detail.regularized ? 'REGULARIZED' : 'NOT REGULARIZED',
                payment_date: detail.factory_payment_date 
                    ? formatDate(detail.factory_payment_date) 
                    : formatDate(new Date()),
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<CrossPaymentFormValues>({
        resolver: zodResolver(CrossPaymentFormSchema),
        defaultValues: transformedInitialData ? {
            details: transformedInitialData.details?.map((detail) => ({
                ...detail,
                paid_amount: detail.paid_amount?.toString(),
            })) ?? [],
        } : {
            details: [],
        },
    });

    const { formState: { errors: validationError }, trigger, watch, control, reset } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset({
                details: transformedInitialData.details?.map((detail) => ({
                    ...detail,
                    paid_amount: detail.paid_amount?.toString(),
                })) ?? [],
            });
        }
    }, [transformedInitialData, reset]);

    return {
        methods,
        validationError,
        trigger,
        watch,
        control,
    };
}
