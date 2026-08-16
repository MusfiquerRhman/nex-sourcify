import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { RDLInvoiceSchema } from "./formSchema";
import type { RDLInvoiceFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetRdlInvoiceByIdTypes } from "~/types/commercialAPITypes";

type RDLInvoiceDetails = NonNullable<GetRdlInvoiceByIdTypes>['rdl_invoice_details'][number];

type RDLInvoiceShipments = NonNullable<RDLInvoiceDetails>['rdl_invoice_shipment_details'][number];

export const useRDLInvoiceForm = (initialData?: GetRdlInvoiceByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            factory_id: initialData.rdl_invoice_details?.[0]?.factory_id ?? undefined,
            buyer_id: initialData.buyer_id ?? undefined,
            term_id: initialData.term_id ?? undefined,
            lc_sc_id: initialData.sales_contracts?.id?.toString() 
                ? initialData.sales_contracts?.id?.toString() 
                : initialData.lc_master?.id?.toString() ?? '',
            invoice_no: initialData.invoice_no ?? '',
            invoice_date: initialData.invoice_date ? formatDateForInput(new Date(initialData.invoice_date)) : '',
            remarks: initialData.remarks ?? '',
            invoice_type: initialData.invoice_type ?? false,
            pi_no: initialData.pi_no ?? '',
            container_no: initialData.container_no ?? '',
            contact_no: initialData.contact_no ?? '',
            discount: initialData.discount ?? undefined,
            details: initialData.rdl_invoice_details?.map((detail: RDLInvoiceDetails) => ({
                db_id: detail.id,
                factory_id: detail.factory_id?.toString() ?? undefined,
                factory_invoice_id: detail?.factory_invoice?.id ?? undefined,
                factory_invoice_no: detail?.factory_invoice?.invoice_no ?? undefined,
                factoryInvoiceDetails: detail.rdl_invoice_shipment_details?.map((shipment: RDLInvoiceShipments) => ({
                    db_id: shipment.id,
                    shipment_details_id: shipment.shipment_details_id ?? undefined,
                    factory_invoice_details_id: shipment.factory_invoice_details_id ?? undefined,
                    invoice_quantity: shipment.invoice_quantity ?? undefined,
                })) ?? [],
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<RDLInvoiceFormValues>({
        resolver: zodResolver(RDLInvoiceSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: undefined,
            term_id: undefined,
            lc_sc_id: undefined,
            invoice_no: undefined,
            invoice_type: false,
            pi_no: undefined,
            invoice_date: formatDateForInput(new Date()),
            remarks: "",
            discount: undefined,
            contact_no: undefined,
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
    const details = useWatch({ control, name: "details" });
    const discount = useWatch({ control, name: "discount" });

    const lcList = api.rdlInvoice.getScLcForRDLInvoice.useQuery(
       (!!term_id && !!buyer_id && !isEdit) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let lcScList: { id: string; sc_lc_no: string }[];

    if(isEdit) {
        const id = initialData.sales_contracts?.id ?? initialData.lc_master?.id;
        const sc_lc_no = initialData.sales_contracts?.sales_contract_no ?? initialData.lc_master?.lc_no;

        lcScList = id && sc_lc_no ? [{ id: String(id), sc_lc_no: String(sc_lc_no) }] : [];
    }
    else {
        lcScList = lcList;
    }
    
    const formFields = useFormFields({lcList: lcScList, isEdit});

    const { invoiceQuantity, invoiceValue } = useMemo(() => {
        return (details ?? []).reduce(
            (acc, factory) => {
                (factory.factoryInvoiceDetails ?? []).forEach((shipment) => {
                    acc.invoiceQuantity += safeNumber(shipment.invoice_quantity);
                    acc.invoiceValue += safeNumber(shipment.invoice_value);
                });

                return acc;
            },
            { invoiceQuantity: 0, invoiceValue: 0 }
        );
    }, [details]);

    const totalValue = useMemo(
        () => invoiceValue - safeNumber(discount),
        [invoiceValue, discount]
    );

    useEffect(() => {
        methods.setValue("invoice_quantity", invoiceQuantity ? invoiceQuantity.toString() : "0");
        methods.setValue("invoice_value", invoiceValue ? invoiceValue.toFixed(2) : "0.00");
        methods.setValue("total_value", totalValue.toFixed(2));
    }, [ invoiceQuantity, invoiceValue, totalValue, methods ]);

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}