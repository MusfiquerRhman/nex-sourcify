import { api } from "~/trpc/react";
import type { PreProductionFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof PreProductionFormValues> = BaseField<T>;

interface Props {
    buyerId: number | undefined;
    styleId: string | undefined;
}

export const useFormFields = (props: Props) => {
    const { buyerId, styleId } = props;

    const buyersQuery = api.buyers.getAllBuyersByTeam.useQuery();
    const stylesQuery = api.ppMeeting.getStyleForPPMeeting.useQuery(buyerId ? { buyerId } : skipToken);
    const styles = stylesQuery.data ?? [];

    const selectedStyle = styles.find((style) => style.id === styleId);
    const queryError = buyersQuery.error ?? stylesQuery.error;
    const isLoadingOptions = buyersQuery.isFetching || stylesQuery.isFetching;

    const formFields: Field<keyof PreProductionFormValues>[] = [
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: buyersQuery.data?.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: buyersQuery.isFetching,
        },
        {
            name: 'style_id',
            label: 'Style',
            placeholder: "Select Style",
            type: "select",
            options: styles.map((style) => ({ label: `${style.style} (${style.buyer_orders.ref_no})`, value: style.id })),
            disabled: !buyerId || stylesQuery.isFetching,
        },
        {
            name: "order_id",
            label: "Order Ref",
            type: "select",
            options: selectedStyle ? [{ label: selectedStyle.buyer_orders.ref_no, value: selectedStyle.order_id }] : [],
            disabled: true,
        },
        {
            name: "factory_id",
            label: "Factory",
            type: "select",
            options: selectedStyle ? [{ label: selectedStyle.buyer_orders.factories.name, value: selectedStyle.buyer_orders.factory_id }] : [],
            disabled: true,
        },
        {
            name: "first_shipment_date",
            label: "First Shipment Date",
            placeholder: "First shipment date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "item",
            label: "Item",
            placeholder: "Enter Item",
            optional: true,
            disabled: true
        },
        {
            name: "fabric_description",
            label: "Fabric Description",
            placeholder: "Enter Fabric Description",
            optional: true,
            disabled: true
        },
        {
            name: "required_gsm",
            label: "Fabric Required GSM",
            placeholder: "Fabric Required GSM",
            optional: true,
            disabled: true
        },
        {
            name: "order_quantity",
            label: "Order Quantity",
            placeholder: "Enter Order Quantity",
            optional: true,
            disabled: true
        },
        {
            name: "daily_production_plan",
            label: "Daily Production Plan (pcs)",
            placeholder: "Enter daily production quantity",
            type: "number",
        },
    ];

    return { formFields, selectedStyle, queryError, isLoadingOptions };
};
