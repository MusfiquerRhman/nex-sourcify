import type { LCOrdersValue } from "../config/formSchema";
import type { BaseField } from "~/types/form";
import type { inferRouterOutputs } from '@trpc/server';
import type { lcMasterRouter } from "~/server/api";
import { useWatch } from "react-hook-form";

type LcMasterRouterOutput = inferRouterOutputs<typeof lcMasterRouter>;

export type GetOrderLCListTypes = LcMasterRouterOutput['getOrdersForLc'];

export type Field<T extends keyof LCOrdersValue> = BaseField<T>;

interface ActionField {
    name: "actions";
    label: string;
    type: "button";
    disabled?: boolean;
};

export const formFields = (
    {filteredOrders, id}: {filteredOrders: GetOrderLCListTypes, id?: string | null}
): (Field<keyof LCOrdersValue> | ActionField)[] => {

    return [
        {
            name: "order_id",
            label: "Order Reference",
            placeholder: "Enter order reference",
            type: "select",
            options: filteredOrders.map(order => ({
                value: order.order_id,
                label: order.ref_no,
            })),
        },
        {
            name: "pi_no",
            label: "PI No",
            placeholder: "Enter PI no",
            optional: true,
        },
        {
            name: "po_no",
            label: "PO No",
            placeholder: "Enter PO no",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "actions",
            label: "Add / Remove PO",
            type: "button",
            disabled: !!id ? false : true, // Disable if no order is selected (id is null or undefined)
        },
    ];
}