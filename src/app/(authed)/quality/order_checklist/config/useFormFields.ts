import { api } from "~/trpc/react";
import type { OrderChecklistFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";
import type { GetOrderChecklistByIdTypes } from "~/types/qualityAPITypes";
import { sampleChecklistStatusOptions } from "~/utils/sampleChecklist";

export type Field<T extends keyof OrderChecklistFormValues> = BaseField<T>;

interface Props {
    buyerId: number | undefined,
    styleId: string | undefined,
    initialData?: GetOrderChecklistByIdTypes,
    canUpdate?: boolean,
}

export const useFormFields = (props: Props) => {
    const { buyerId, styleId, initialData } = props;
    const isEditing = !!initialData;

    const buyersQuery = api.buyers.getAllBuyersByTeam.useQuery(undefined, { enabled: !isEditing });
    const stylesQuery = api.orderChecklist.getStyleForOrderChecklist.useQuery(!isEditing && buyerId ? { buyerId } : skipToken);
    const selectedStyle = stylesQuery.data?.find((style) => style.id === styleId);
    const shipmentsQuery = api.orderChecklist.getShipmentForOrderChecklist.useQuery(!isEditing && selectedStyle ? { styleId: selectedStyle.id } : skipToken);
    const queryError = buyersQuery.error ?? stylesQuery.error ?? shipmentsQuery.error;
    const isLoadingOptions = !isEditing && (buyersQuery.isFetching || stylesQuery.isFetching || shipmentsQuery.isFetching);

    const formFields: Field<keyof OrderChecklistFormValues>[] = [
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [...sampleChecklistStatusOptions],
            disabled: isEditing && !props.canUpdate,
        },
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: initialData 
                ? [{ label: initialData.buyer_name, value: initialData.buyer_id }] 
                : buyersQuery.data?.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEditing || buyersQuery.isFetching,
        },
        {
            name: 'style_id',
            label: 'Style',
            placeholder: "Select Style",
            type: "select",
            options: initialData 
                ? [{ label: `${initialData.style} (${initialData.ref_no})`, value: initialData.style_id }]
                : stylesQuery.data?.map((style) => ({ label: `${style.style} (${style.buyer_orders.ref_no})`, value: style.id })),
            disabled: isEditing || !buyerId || stylesQuery.isFetching,
        },
        {
            name: "order_id",
            label: "Order Ref",
            type: "select",
            options: initialData 
                ? [{ label: initialData.ref_no, value: initialData.order_id }]
                : selectedStyle ? [{ label: selectedStyle.buyer_orders.ref_no, value: selectedStyle.order_id }] : [],
            disabled: true,
        },
        {
            name: "po_id",
            label: "Po",
            placeholder: "Select PO",
            type: "select",
            options: initialData 
                ? [{ label: initialData.po, value: initialData.shipment_id }] 
                : shipmentsQuery.data?.map((shipment) => ({ label: shipment.buyer_po, value: shipment.id })),
            disabled: isEditing || !selectedStyle || shipmentsQuery.isFetching,
        },
        {
            name: "factory_name",
            label: "Factory",
            placeholder: "Enter Factory",
            optional: true,
            disabled: true
        },
    ];

    return { formFields, selectedStyle, queryError, isLoadingOptions };
}
