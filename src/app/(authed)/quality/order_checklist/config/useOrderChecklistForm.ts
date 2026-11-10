import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { orderChecklistFormSchema } from "./formSchema";
import type { OrderChecklistFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetOrderChecklistByIdTypes } from "~/types/qualityAPITypes";
import { getTechnicalCheckValue } from "~/utils/orderChecklist";
import { sampleChecklistStatusOptions } from "~/utils/sampleChecklist";

export const useOrderChecklistForm = (initialData?: GetOrderChecklistByIdTypes, canUpdate = true) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            buyer_id: Number(initialData.buyer_id) ?? undefined,
            order_id: initialData.order_id ?? undefined,
            style_id: initialData.style_id ?? undefined,
            po_id: initialData.shipment_id,
            status: sampleChecklistStatusOptions.find((option) => option.value === initialData.status)?.value,
            factory_name: initialData.factory_name ?? undefined,
            details: initialData.details.map((detail) => ({
                db_id: detail.id,
                serial_no: detail.serial_no ?? undefined,
                document_details: detail.document_details ?? undefined,
                technical_check: getTechnicalCheckValue(detail.technical_check),
                technical_remarks: detail.technical_remarks ?? '',
                technical_check_date: detail.technical_check === 1 && detail.technical_check_date ? formatDateForInput(detail.technical_check_date) : '',
                qa_check: detail.qa_check ?? false,
                qa_remarks: detail.qa_remarks ?? '',
                qa_check_date: detail.qa_check_date ? formatDateForInput(detail.qa_check_date) : '',
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<OrderChecklistFormValues>({
        resolver: zodResolver(orderChecklistFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: 0,
            order_id: '',
            style_id: '',
            po_id: '',
            status: undefined,
            factory_name: '',
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);


    const buyerId = useWatch({ control, name: 'buyer_id' });
    const styleId = useWatch({ control, name: 'style_id' });

    const { formFields, selectedStyle, queryError, isLoadingOptions } = useFormFields({ buyerId, styleId, initialData, canUpdate });

    useEffect(() => {
        if (initialData) return;
        setValue('style_id', '');
    }, [buyerId, initialData, setValue]);

    useEffect(() => {
        if (initialData) return;
        setValue('po_id', '');
    }, [buyerId, styleId, initialData, setValue]);

    useEffect(() => {
        if (initialData) return;
        setValue('order_id', selectedStyle?.order_id ?? '');
        setValue('factory_name', selectedStyle?.buyer_orders.factories.name ?? '');
    }, [selectedStyle, initialData, setValue]);

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control, selectedStyle, queryError, isLoadingOptions };
}
