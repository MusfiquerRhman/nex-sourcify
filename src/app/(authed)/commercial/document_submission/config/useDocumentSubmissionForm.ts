import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { DocumentSubmissionSchema } from "./formSchema";
import type { DocumentSubmissionFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetDocumentSubmissionByIdTypes } from "~/types/commercialAPITypes";

type RDLInvoiceDetails = NonNullable<GetDocumentSubmissionByIdTypes>['rdlInvoices'][number];

type FactoryInvoiceShipments = NonNullable<RDLInvoiceDetails>['factoryInvoices'][number];

export const useDocumentSubmissionForm = (initialData?: GetDocumentSubmissionByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            buyer_id: initialData.buyer_id ?? undefined,
            term_id: initialData.term_id ?? undefined,
            lc_sc_id: initialData.lc_sc_id?.toString() ?? '',
            sc_lc_no: initialData.sc_lc_no ?? '',
            fdbc_no: initialData.fdbc_no ?? '',
            fdbc_date: initialData.fdbc_date 
                ? formatDateForInput(new Date(initialData.fdbc_date)) : '',
            fdbc_value: initialData.fdbc_value ?? undefined,
            submission_date: initialData.submission_date 
                ? formatDateForInput(new Date(initialData.submission_date)) : '',
            awb_no: initialData.awb_no ?? '',
            awb_date: initialData.awb_date 
                ? formatDateForInput(new Date(initialData.awb_date)) : '',
            courier_id: initialData.courier_id ?? undefined,
            lc_sc_date: initialData.lc_sc_date
                ? formatDateForInput(new Date(initialData.lc_sc_date)) : '',
            bank_name: initialData.bank_name ?? '',
            rdlInvoices: initialData.rdlInvoices?.map((detail: RDLInvoiceDetails) => ({
                db_id: detail.db_id,
                rdl_invoice_id: detail.rdl_invoice_id?.toString() ?? undefined,
                rdl_invoice_no: detail?.rdl_invoice_no ?? undefined,
                received_rdl_value: detail.received_value ? detail.received_value : undefined,
                factoryInvoices: detail.factoryInvoices?.map((factoryInvoice: FactoryInvoiceShipments) => ({
                    db_id: factoryInvoice.db_id,
                    factory_invoice_id: factoryInvoice.factory_invoice_id?.toString(),
                    factory_invoice_no: factoryInvoice.factory_invoice_no ?? undefined,
                    factory_fdbc_no: factoryInvoice.factory_fdbc_no ?? undefined,
                    rdl_invoice_details_id: factoryInvoice.rdl_invoice_details_id ?? undefined,
                })) ?? [],
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<DocumentSubmissionFormValues>({
        resolver: zodResolver(DocumentSubmissionSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: undefined,
            term_id: undefined,
            lc_sc_id: undefined,
            fdbc_no: undefined,
            fdbc_date: formatDateForInput(new Date()),
            fdbc_value: undefined,
            submission_date: formatDateForInput(new Date()),
            awb_no: undefined,
            awb_date: undefined,
            courier_id: undefined,
            rdlInvoices: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const fdbcNoValue = watch("fdbc_no");
    
    useEffect(() => {
        if (fdbcNoValue && fdbcNoValue !== fdbcNoValue.toUpperCase()) {
            setValue("fdbc_no", fdbcNoValue.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [fdbcNoValue, setValue]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const lcList = api.documentSubmission.getScLcForDocumentSubmission.useQuery(
       (!!term_id && !!buyer_id && !isEdit) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let lcScList: { id: string; sc_lc_no: string }[];

    if(isEdit) {
        const id = initialData.lc_sc_id;

        lcScList = id ? [{ id: String(id), sc_lc_no: String(initialData.sc_lc_no) }] : [];
    }
    else {
        lcScList = lcList;
    }
    
    const formFields = useFormFields({lcList: lcScList, isEdit});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}