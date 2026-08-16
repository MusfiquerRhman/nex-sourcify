import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FactoryInvoiceFormSchema } from "./formSchema";
import type { FactoryInvoiceFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetFactoryInvoiceByIdTypes } from "~/types/commercialAPITypes";

type FactoryInvoiceDetails = NonNullable<GetFactoryInvoiceByIdTypes>['factory_invoice_details'][number];

export const useFactoryInvoiceForm = (initialData?: GetFactoryInvoiceByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            factory_id: initialData.factory_id,
            buyer_id: initialData.buyer_id ?? undefined,
            term_id: initialData.term_id,
            lc_sc_id: initialData.sales_contract_id?.toString() ? initialData.sales_contract_id?.toString() : initialData.lc_id?.toString() ?? '',
            invoice_no: initialData.invoice_no ?? '',
            invoice_date: initialData.invoice_date ? formatDateForInput(new Date(initialData.invoice_date)) : '',
            remarks: initialData.remarks ?? '',
            discount: initialData.discount ?? undefined,
            shipment_mode: initialData.shipment_mode ?? '',
            notifyParties: initialData.notifyPartyIds?.map((notifyParty) => notifyParty.notify_party_id ?? undefined) ?? [],
            consignee_ids: initialData.consignee_ids?.map((consignee) => consignee.consignee_id ?? undefined) ?? [],
            freight_term_id: initialData.freight_term_id ?? undefined,
            port_of_loading: initialData.port_of_loading ?? undefined,
            details: initialData.factory_invoice_details?.map((detail: FactoryInvoiceDetails) => ({
                db_id: detail.id,
                exfactory_shipment_id: detail.exfactory_shipment_id ?? undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<FactoryInvoiceFormValues>({
        resolver: zodResolver(FactoryInvoiceFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            factory_id: undefined,
            buyer_id: undefined,
            term_id: undefined,
            lc_sc_id: undefined,
            invoice_no: undefined,
            invoice_date: formatDateForInput(new Date()),
            remarks: "",
            discount: undefined,
            freight_term_id: undefined,
            port_of_loading: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const invoiceNoValue = watch("invoice_no");
    
    useEffect(() => {
        if (invoiceNoValue && invoiceNoValue !== invoiceNoValue.toUpperCase()) {
            setValue("invoice_no", invoiceNoValue.toUpperCase(), {
            shouldValidate: true,
            shouldDirty: true,
            });
        }
        }, [invoiceNoValue, setValue]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });
    const factory_id = useWatch({ control, name: 'factory_id' });

    const lcList = api.factoryInvoice.getScLcForFactoryInvoice.useQuery(
       (!!term_id && !!buyer_id && !!factory_id && !isEdit) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
            factory_id: safeNumber(factory_id),
        } : skipToken
    ).data || [];

    let lcScList;

    if(isEdit) {
        lcScList = [{ id: initialData.sales_contract_id ?? initialData.lc_id, sc_lc_no: initialData.sales_contract_no ?? initialData.lc_no }]
    }
    else {
        lcScList = lcList;
    }
    
    const formFields = useFormFields({lcList: lcScList, isEdit, buyer_id});

    const deliveryQuantity = useWatch({ control, name: 'details' })?.reduce((total, detail) => {
        const quantity = safeNumber(detail.delivery_quantity);
        return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);

    const invoiceValue = useWatch({ control, name: 'details' })?.reduce((total, detail) => {
        const value = safeNumber(detail.factory_value);
        return total + (isNaN(value) ? 0 : value);
    }, 0);

    useEffect(() => {
        if (deliveryQuantity !== undefined) {
            methods.setValue('invoice_quantity', deliveryQuantity.toString());
        }
    }, [deliveryQuantity, methods]);

    useEffect(() => {
        if (invoiceValue !== undefined) {
            methods.setValue('invoice_value', invoiceValue.toFixed(2));
        }
    }, [invoiceValue, methods]);

    const totalValue = useWatch({ control, name: 'discount' }) !== undefined
        ? (invoiceValue || 0) - (safeNumber(methods.getValues('discount')) || 0)
        : invoiceValue;

    useEffect(() => {
        if (totalValue !== undefined) {
            methods.setValue('total_value', totalValue.toFixed(2));
        }
    }, [totalValue, methods]);

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