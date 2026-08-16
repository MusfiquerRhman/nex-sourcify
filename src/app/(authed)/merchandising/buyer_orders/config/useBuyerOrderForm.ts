import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { orderFormSchema } from "./formSchema";
import type { OrderFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetBuyerOrderByIdTypes } from "~/types/merchandisingAPITypes";

type OrderStyle = NonNullable<GetBuyerOrderByIdTypes['order_styles']>[number];
type ShipmentDetail = NonNullable<OrderStyle['shipment_details']>[number];
type ShipmentItem = NonNullable<ShipmentDetail['shipment_item_details']>[number];

export const useBuyerOrderForm = (initialData?: GetBuyerOrderByIdTypes) => {
    const getDefaultValues = useCallback((): OrderFormValues => {
        if (!initialData) {
            return {
                order: {
                    buyer_id: '',
                    season_id: '',
                    ref_no: '',
                    fob_type_id: '',
                    order_date: formatDateForInput(new Date()),
                    team_id: '',
                    brand_id: '',
                    department_id: '',
                    factory_id: '',
                    secondary_currency_id: undefined,
                    currency_rate: 1.00,
                    remarks: "",
                    status: undefined,
                    styles: [],
                },
            };
        }

        return {
            order: {
                ...initialData,
                db_id: initialData?.id,
                department_id: initialData.department_id?.toString() ?? '',
                buyer_id: initialData.buyer_id?.toString() ?? '',
                team_id: initialData.team_id?.toString() ?? '',
                season_id: initialData.season_id?.toString() ?? '',
                fob_type_id: initialData.fob_type_id?.toString() ?? '',
                brand_id: initialData.brand_id?.toString() ?? '',
                factory_id: initialData.factory_id?.toString() ?? '',
                secondary_currency_id: initialData.secondary_currency_id 
                    ? initialData.secondary_currency_id.toString() 
                    : undefined,
                currency_rate: initialData.currency_rate ?? undefined,
                status: initialData.status ?? undefined,
                remarks: initialData.remarks ?? "",
                order_date: initialData.order_date 
                    ? formatDateForInput(new Date(initialData.order_date)) 
                    : formatDateForInput(new Date()),
                styles: initialData.order_styles?.map((style: OrderStyle) => ({
                    ...style,
                    db_id: style?.id,
                    product_type_id: String(style.product_type_id),
                    product_id: String(style.product_id),
                    fabric_id: String(style.fabric_id),
                    supplier_id: style.supplier_id?.toString(),
                    photo_url: style.photo_url ?? undefined,
                    file_size: style.file_size ?? undefined,
                    shipments: style.shipment_details?.map((shipment: ShipmentDetail) => ({
                        ...shipment,
                        db_id: shipment?.id,
                        etd_date: shipment.etd_date 
                            ? formatDateForInput(new Date(shipment.etd_date)) : '',
                        handover_date: shipment.handover_date 
                            ? formatDateForInput(new Date(shipment.handover_date)) : '',
                        size_id: String(shipment.size_id),
                        destination_id: String(shipment.destination_id),
                        payment_term_id: String(shipment.payment_term_id),
                        shipment_mode: shipment.shipment_mode ?? '',
                        ex_factory_exists: shipment.ex_factory_exists,
                        colors: shipment.shipment_item_details?.map((color: ShipmentItem) => ({
                            ...color,
                            db_id: color?.id,
                            color_id: String(color.color_id),
                            quantity: color.quantity,
                        }))
                    })),
                })) ?? [],
            },
        };
    }, [initialData]);

    const methods = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: getDefaultValues(),
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, watch, control } = methods;

    // Effect to reset form when initialData changes
    useEffect(() => {
        methods.reset(getDefaultValues());
    }, [methods, getDefaultValues]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof OrderFormValues);
    }, [validationError, setFocus]);

    const buyerId = watch("order.buyer_id");
    const brandId = watch("order.brand_id");

    return {
        methods,
        handleSubmit,
        formFields: useFormFields({
            buyerID: Number(buyerId), 
            brandID: Number(brandId)
        }),
        validationError,
        trigger,
        watch,
        control,
    };
}

