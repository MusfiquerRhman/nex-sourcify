import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { orderChecklistFormSchema } from "./formSchema";
import type { OrderChecklistFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetOrderChecklistByIdTypes } from "~/types/qualityAPITypes";

export const useOrderChecklistForm = (initialData?: GetOrderChecklistByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            buyer_id: Number(initialData.buyer_id) ?? undefined,
            order_id: initialData.order_id ?? undefined,
            style_id: initialData.style_id ?? undefined,
            po_id: initialData.shipment_id,
            factory_name: initialData.factory_name ?? undefined,
            details: initialData.details.map((detail) => ({
                db_id: detail.id,
                serial_no: detail.serial_no ?? undefined,
                document_details: detail.document_details ?? undefined,
                technical_check: detail.technical_check ?? false,
                technical_remarks: detail.technical_remarks ?? '',
                technical_check_date: detail.technical_check_date ? formatDateForInput(detail.technical_check_date) : '',
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
            buyer_id: undefined,
            order_id: undefined,
            style_id: undefined,
            po_id: undefined,
            factory_name: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);


    const buyerId = useWatch({ control, name: 'buyer_id' });
    const orderId = useWatch({ control, name: 'order_id' });
    const styleId = useWatch({ control, name: 'style_id' });

    const formFields = useFormFields({ buyerId, orderId, styleId, initialData });

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}
