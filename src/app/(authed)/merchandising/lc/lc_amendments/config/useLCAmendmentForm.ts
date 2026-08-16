import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { GetLCAmendmentByIdTypes } from "~/types/merchandisingAPITypes";

export const useLCAmendmentForm = (lcData?: GetLCAmendmentByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            db_id: undefined,
            buyer_id: undefined,
            lc_id: '',
            lc_open_date: formatDateForInput(new Date()),
            lc_received_date: '',
            lc_quantity: undefined,
            lc_value: undefined,
            currency_id: undefined,
            company_id: undefined,
            rdl_bank_id: undefined,
            buyer_bank_id: undefined,
            lc_status: true,
            latest_shipment_date: '',
            expire_date: '',
            remarks: '',
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control } = methods;

    // Effect to reset form when Data changes
    useEffect(() => {
        if (lcData && !Array.isArray(lcData)) {
            const data = lcData;

            methods.reset({
                db_id: data.id ?? undefined,
                buyer_id: data.buyer_id ?? undefined,
                amendment_no: data.amendment_no ? data.amendment_no.toString() : undefined,
                lc_id: data.lc_id ?? '',
                lc_open_date: formatDateForInput(new Date()),
                lc_received_date: '',
                lc_quantity: data.amend_quantity ?? undefined,
                lc_value: data.amend_value ?? undefined,
                currency_id: undefined,
                company_id: undefined,
                rdl_bank_id: undefined,
                buyer_bank_id: undefined,
                lc_status: true,
                latest_shipment_date: '',
                expire_date: '',
                remarks: data.remarks ?? '',
                details: data.lc_amendment_orders?.map((detail: any) => ({
                    db_id: detail.id ?? detail.db_id,
                    pi_no: detail.dm_pi_no ?? '',
                    po_no: detail.po_no ?? '',
                    ...detail,
                })) ?? [],
            });
        }
    }, [lcData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const lc_id = useWatch({ control, name: 'lc_id' });

    const { data: lcDetails, isSuccess } = api.lcAmendment.getLcDetailsForAmendment.useQuery(
        !!lc_id ? { id: lc_id } : skipToken,
    );

    useEffect(() => {
        if (!lc_id || !isSuccess || !lcDetails ) return;

        const currentValues = methods.getValues();

        methods.reset({
            ...currentValues,
            company_id: lcDetails?.company_id ?? undefined,
            currency_id: lcDetails?.currency_id ?? undefined,
            rdl_bank_id: lcDetails?.rdl_bank_id ?? undefined,
            buyer_bank_id: lcDetails?.buyer_bank_id ?? undefined,
            remarks: lcDetails?.remarks ?? '',
            lc_open_date: lcDetails?.lc_open_date ? formatDateForInput(new Date(lcDetails?.lc_open_date)) : formatDateForInput(new Date()),
            lc_received_date: lcDetails?.lc_received_date ? formatDateForInput(new Date(lcDetails?.lc_received_date)) : '',
            latest_shipment_date: lcDetails?.latest_shipment_date ? formatDateForInput(new Date(lcDetails?.latest_shipment_date)) : '',
            expire_date: lcDetails?.lc_expire_date ? formatDateForInput(new Date(lcDetails?.lc_expire_date)) : '',
            order_lc_quantity: lcDetails?.order_lc_quantity ? lcDetails.order_lc_quantity.toString() : '',
            order_lc_value: lcDetails?.order_lc_value ? lcDetails.order_lc_value.toFixed(2) : '',
            details: lcDetails?.lc_orders?.map((detail: any) => ({
                db_id: detail.id ?? detail.db_id,
                pi_no: detail.dm_pi_no ?? '',
                po_no: detail.po_no ?? '',
                ...detail,
            })) ?? [],
        });
    }, [lcDetails, lcData]);

    const isEdit = Boolean(lcData);

    const buyerId = useWatch({ control, name: 'buyer_id' });
    const companyId = useWatch({ control, name: 'company_id' });
    const lcAmendmentId = useWatch({ control, name: 'db_id' });

    return { 
        methods, 
        handleSubmit,
        formFields: formFields({ isEdit, buyer_id: buyerId, company_id: companyId, lcAmendmentId: lcAmendmentId }),
        validationError, 
        control 
    };
}