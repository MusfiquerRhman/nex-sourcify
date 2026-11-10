import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { preProductionMeetingFormSchema, type PreProductionFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const usePreProductionMeetingForm = () => {
    const methods = useForm<PreProductionFormValues>({
        resolver: zodResolver(preProductionMeetingFormSchema),
        defaultValues: {
            buyer_id: 0,
            factory_id: 0,
            order_id: '',
            style_id: '',
            first_shipment_date: '',
            item: '',
            fabric_description: '',
            required_gsm: '',
            order_quantity: '',
        },
    });

    const { handleSubmit, formState: { errors: validationError }, control, setValue } = methods;
    const buyerId = useWatch({ control, name: 'buyer_id' });
    const styleId = useWatch({ control, name: 'style_id' });
    
    const { formFields, selectedStyle, queryError, isLoadingOptions } = useFormFields({ buyerId, styleId });

    useEffect(() => {
        setValue('style_id', '');
    }, [buyerId, setValue]);

    useEffect(() => {
        const firstShipmentDate = selectedStyle?.shipment_details[0]?.factory_shipment_details?.exfactory_date;
        const fabric = selectedStyle?.fabrics;

        setValue('order_id', selectedStyle?.order_id ?? '');
        setValue('factory_id', selectedStyle?.buyer_orders.factory_id ?? 0);
        setValue('first_shipment_date', firstShipmentDate ? formatDateForInput(firstShipmentDate) : '');
        setValue('item', selectedStyle?.products.name ?? '');
        setValue('fabric_description', fabric?.description ?? fabric?.name ?? '');
        setValue('required_gsm', fabric?.value != null ? `${fabric.value} ${fabric.unit ?? ''}`.trim() : '');
        setValue('order_quantity', selectedStyle ? String(selectedStyle.order_quantity) : '');
    }, [selectedStyle, setValue]);

    return { methods, handleSubmit, formFields, validationError, control, queryError, isLoadingOptions, selectedStyle };
};
