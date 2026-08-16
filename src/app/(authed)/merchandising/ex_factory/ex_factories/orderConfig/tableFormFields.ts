import type { ExFactoryOrdersValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ExFactoryOrdersValues> = BaseField<T>;

interface FormFieldsProps {
    orders: {
        order_id: string;
        ref_no: string;
    }[];
    isEdit?: boolean;
}

export const formFields = (Props: FormFieldsProps): Field<keyof ExFactoryOrdersValues>[] => {
    const { orders, isEdit } = Props;

    return [
        {
            name: "order_id",
            label: "Orders",
            placeholder: "Select order",
            type: "select",
            options: orders.map((order) => ({ 
                label: order.ref_no, 
                value: order.order_id 
            })) ?? [],
            disabled: isEdit,
            optional: isEdit,
        },
    ]
}
