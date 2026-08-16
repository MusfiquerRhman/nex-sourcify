import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FactoryPaymentFormSchema } from "./formSchema";
import type { FactoryPaymentFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import type { GetFactoryPaymentByIdTypes } from "~/types/accountingAPITypes";
import { safeNumber } from "~/utils/numbers";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";

type FactoryInvoiceTypes = NonNullable<GetFactoryPaymentByIdTypes>['factoryPayments'][number];

export const useFactoryPaymentForm = (initialData?: GetFactoryPaymentByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData?.factoryPaymentHeader ? {
            term_name: initialData.factoryPaymentHeader.term_name,
            fdbc_no: initialData.factoryPaymentHeader.fdbc_no ?? undefined,
            realization_date: initialData.factoryPaymentHeader.realization_date 
                ? formatDateForInput(initialData.factoryPaymentHeader.realization_date) 
                : undefined,
            rdl_invoice_value: currencyFormatter(safeNumber(initialData.factoryPaymentHeader.rdl_invoice_value), '$') ?? undefined,
            realized_amount: currencyFormatter(safeNumber(initialData.factoryPaymentHeader.realized_amount), '$') ?? undefined,
            factory_paid_amount: initialData.factoryPaymentHeader.factory_paid_amount?.toFixed(2) ?? undefined,
            remarks: initialData.factoryPaymentHeader.remarks ?? undefined,
            details: initialData.factoryPayments?.map((detail: FactoryInvoiceTypes) => ({
                db_id: detail.db_id ?? undefined,
                factory_name: detail.factory_name ?? undefined,
                factory_invoice_no: detail.factory_invoice_no ?? undefined,
                factory_invoice_id: detail.factory_invoice_id ?? undefined,
                factory_fdbc_no: detail.fdbc_no ?? undefined,
                invoice_date: detail.factory_invoice_date 
                    ? formatDate(detail.factory_invoice_date) 
                    : undefined,
                invoice_quantity: quantityFormatter(safeNumber(detail.invoice_quantity)) ?? undefined,
                invoice_value: currencyFormatter(safeNumber(detail.invoice_value), '$') ?? undefined,
                paid_amount: safeNumber(detail.paid_amount) ?? undefined,
                factory_payment_no: detail.factory_payment_no ?? undefined,
                payment_date: detail.payment_date ? formatDateForInput(detail.payment_date) : formatDateForInput(new Date()),
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<FactoryPaymentFormValues>({
        resolver: zodResolver(FactoryPaymentFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_name: undefined,
            fdbc_no: undefined,
            realization_date: formatDateForInput(new Date()),
            rdl_invoice_value: undefined,
            realized_amount: undefined,
            factory_paid_amount: undefined,
            remarks: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    return {
        methods,
        handleSubmit,
        formFields: useFormFields(),
        validationError,
        trigger,
        watch,
        control,
    };
}
