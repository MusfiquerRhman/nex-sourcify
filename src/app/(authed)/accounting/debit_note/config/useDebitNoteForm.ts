import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { DebitNoteFormSchema } from "./formSchema";
import type { DebitNoteFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetDebitNoteByIdTypes } from "~/types/accountingAPITypes";
import { safeNumber } from "~/utils/numbers";
import { quantityFormatter } from "~/utils/localNumberStrings";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

type DebitNoteType = NonNullable<GetDebitNoteByIdTypes>;

export const useDebitNoteForm = (initialData?: DebitNoteType) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.db_id ?? undefined,
            term_id: initialData.term_id ?? undefined,
            dn_date: initialData.dn_date 
                ? formatDateForInput(initialData.dn_date) 
                : undefined,
            factory_id: initialData.factory_id ?? undefined,
            dn_ref: initialData.dn_ref ?? undefined,
            buyer_id: initialData.buyer_id ?? undefined,
            lc_sc_id: initialData.lc_sc_id ?? undefined,
            less: safeNumber(initialData.less) ?? undefined,
            processing_charges: safeNumber(initialData.processing_charges) ?? undefined,
            conversion_rate: safeNumber(initialData.conversion_rate) ?? undefined,
            additional_charges: safeNumber(initialData.additional_charges) ?? undefined,
            remarks: initialData.remarks ?? undefined,
            details: initialData.details?.map((detail: any) => ({
                db_id: detail.db_id ?? undefined,
                po_no: detail.po_no ?? undefined,
                factory_invoice_id: detail.factory_invoice_id ?? undefined,
                factory_invoice_no: detail.factory_invoice_no ?? undefined,
                exfactory_shipment_id: detail.exfactory_shipment_id ?? undefined,
                value: quantityFormatter(safeNumber(detail.value)) ?? undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<DebitNoteFormValues>({
        resolver: zodResolver(DebitNoteFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_id: undefined,
            dn_date: formatDateForInput(new Date()),
            factory_id: undefined,
            dn_ref: undefined,
            buyer_id: undefined,
            lc_sc_id: undefined,
            remarks: undefined,
            less: undefined,
            processing_charges: undefined,
            conversion_rate: undefined,
            additional_charges: undefined,
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

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const lcList = api.debitNotes.getLCScForDebitNotes.useQuery(
       (!!term_id && !!buyer_id && !isEdit) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let lcScList: { lc_sc_id: string; sc_lc_no: string }[];

    if(isEdit) {
        const id = initialData.lc_sc_id;

        lcScList = id ? [{ lc_sc_id: String(id), sc_lc_no: String(initialData.lc_sc_no) }] : [];
    }
    else {
        lcScList = lcList;
    }

    return {
        methods,
        handleSubmit,
        formFields: useFormFields({lcList: lcScList, isEdit}),
        validationError,
        trigger,
        watch,
        control,
    };
}
