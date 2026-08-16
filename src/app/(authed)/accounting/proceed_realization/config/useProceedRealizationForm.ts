import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { ProceedRealizationFormSchema } from "./formSchema";
import type { ProceedRealizationFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetProceedRealizationByIdTypes } from "~/types/accountingAPITypes";
import { currencyFormatter } from "~/utils/localNumberStrings";

type RDLInvoiceTypes = NonNullable<GetProceedRealizationByIdTypes>['details'][number];

export const useProceedRealizationForm = (initialData?: GetProceedRealizationByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            term_id: initialData.term_id,
            buyer_id: initialData.buyer_id ?? undefined,
            lc_sc_no: initialData.lc_sc_no ?? undefined,
            proceed_date: initialData.realization_date 
                ? formatDateForInput(new Date(initialData.realization_date)) : '',
            document_submission_id: initialData.document_submission_id,
            document_submission_no: initialData.document_submission_no ?? undefined,
            bank_charge: initialData.bank_charge ?? undefined,
            document_charge: initialData.document_charge ?? undefined,
            discount_charge: initialData.discount_charge ?? undefined,
            details: initialData.details?.map((detail: RDLInvoiceTypes) => ({
                db_id: detail.db_id,
                rdl_invoice_id: detail.rdl_invoice_id ?? undefined,
                rdl_invoice_no: detail.rdl_invoice_no ?? undefined,
                invoice_value: detail.realized_amount != null ? currencyFormatter(safeNumber(detail.realized_amount), '$') : undefined,
                proceed_value: detail.proceed_value ?? undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<ProceedRealizationFormValues>({
        resolver: zodResolver(ProceedRealizationFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_id: undefined,
            buyer_id: undefined,
            proceed_date: formatDateForInput(new Date()),
            document_submission_id: undefined,
            document_submission_no: undefined,
            bank_charge: undefined,
            discount_charge: undefined,
            document_charge: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const documentSubmissionList = api.proceedRealization.getDocumentSubmissionForProceedRealization.useQuery(
       (!!term_id && !!buyer_id) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let documentSubmissions;

    if(isEdit) {
        documentSubmissions = [{ 
            id: initialData.document_submission_id, 
            fdbc_no: initialData.document_submission_no ?? '' 
        }]
    }
    else {
        documentSubmissions = documentSubmissionList;
    }
    
    const formFields = useFormFields({documentSubmissions: documentSubmissions, isEdit, buyer_id});

    const totalProceedValue = useWatch({
        control,
        name: 'details',
    })?.reduce((acc, detail) => acc + (detail.proceed_value || 0), 0) ?? 0;

    useEffect(() => {
        setValue('invoice_value', totalProceedValue.toFixed(2));
    }, [totalProceedValue, setValue]);

    return {
        methods,
        handleSubmit,
        formFields,
        validationError,
        trigger,
        watch,
        control,
    };
}
