import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetLCbyIdTypes } from "~/types/merchandisingAPITypes";

export const useLCForm = (lcData?: GetLCbyIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            db_id: undefined,
            buyer_id: undefined,
            lc_no: '',
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

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (lcData && !Array.isArray(lcData)) {
            const data = lcData;

            methods.reset({
                db_id: data.id ?? undefined,
                buyer_id: data.buyer_id ?? undefined,
                lc_no: data.lc_no ?? '',
                lc_open_date: data.lc_open_date ? formatDateForInput(new Date(data.lc_open_date)) : formatDateForInput(new Date()),
                lc_received_date: data.lc_received_date ? formatDateForInput(new Date(data.lc_received_date)) : '',
                lc_quantity: data.quantity ?? undefined,
                lc_value: data.lc_value ?? 0,
                currency_id: data.currency_id ?? undefined,
                company_id: data.company_id ?? undefined,
                rdl_bank_id: data.rdl_bank_id ?? undefined,
                buyer_bank_id: data.buyer_bank_id ?? undefined,
                lc_status: data.status ?? true,
                latest_shipment_date: data.latest_shipment_date ? formatDateForInput(new Date(data.latest_shipment_date)) : '',
                expire_date: data.lc_expire_date
                    ? formatDateForInput(new Date(data.lc_expire_date))
                    : '',
                remarks: data.remarks ?? '',
                order_lc_quantity: data.order_lc_quantity?.toFixed(2) ?? undefined,
                order_lc_value: data.order_lc_value?.toFixed(2) ?? undefined,
                details: data.lc_orders?.map((detail: any) => ({
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

    const isEdit = Boolean(lcData);

    const buyerId = useWatch({ control, name: 'buyer_id' });
    const companyId = useWatch({ control, name: 'company_id' });

    return { 
        methods, 
        handleSubmit,
        formFields: formFields({ isEdit, buyer_id: buyerId, company_id: companyId }),
        validationError, 
        control 
    };
}