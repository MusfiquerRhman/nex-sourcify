import { api } from "~/trpc/react";
import type { OrderChecklistFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";
import type { GetOrderChecklistByIdTypes } from "~/types/qualityAPITypes";

export type Field<T extends keyof OrderChecklistFormValues> = BaseField<T>;

interface Props {
    buyerId: number | undefined,
    orderId: string | undefined,
    styleId: string | undefined,
    initialData?: GetOrderChecklistByIdTypes,
}

export const useFormFields = (props: Props): Field<keyof OrderChecklistFormValues>[] => {
    const { buyerId, orderId, styleId, initialData } = props;
    const isEditing = !!initialData;

    const buyers = api.buyers.getAllBuyersByTeam.useQuery(undefined, { enabled: !isEditing }).data ?? [];

    const orders = api.orderChecklist.getOrdersForChecklist.useQuery(
        !isEditing && buyerId ? { buyerId: Number(buyerId) } : skipToken
    ).data ?? [];

    const styles = api.orderChecklist.getStyleForOrderChecklist.useQuery(
        !isEditing && orderId ? { orderId } : skipToken
    ).data ?? [];

    const po = api.orderChecklist.getShipmentForOrderChecklist.useQuery(
        !isEditing && styleId ? { styleId } : skipToken
    ).data ?? [];

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: initialData 
                ? [{ label: initialData.buyer_name, value: initialData.buyer_id }] 
                : buyers.map((b) => ({ label: b.buyer_name, value: b.id })),
            disabled: isEditing,
        },
        {
            name: "order_id",
            label: "Order Ref",
            placeholder: "Select Order",
            type: "select",
            options: initialData 
                ? [{ label: initialData.ref_no, value: initialData.order_id }] 
                : orders.map((o) => ({ label: o.ref_no, value: o.id.toString() })),
            disabled: isEditing,
        },
        {
            name: 'style_id',
            label: 'Style',
            placeholder: "Select Style",
            type: "select",
            options: initialData 
                ? [{ label: initialData.style, value: initialData.style_id }] 
                : styles.map((s) => ({ label: s.style, value: s.id.toString() })),
            disabled: isEditing,
        },
        {
            name: "po_id",
            label: "Po",
            placeholder: "Select PO",
            type: "select",
            options: initialData 
                ? [{ label: initialData.po, value: initialData.shipment_id }] 
                : po.map((p) => ({ label: p.buyer_po, value: p.id.toString() })),
            disabled: isEditing,
        },
        {
            name: "factory_name",
            label: "Factory",
            placeholder: "Enter Factory",
            optional: true,
            disabled: true
        },
    ]
}
