import type { CommissionDistributionFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CommissionDistributionFormValues> = BaseField<T>;

interface PropsType {
    order_id: string;
    ref_no: string;
    isEdit?: boolean;
}

export const useFormFields = ({availableOrders, isEdit}: {availableOrders: PropsType[], isEdit?: boolean}): Field<keyof CommissionDistributionFormValues>[] => {

    return [
        {
            name: "order_id",
            label: "Order",
            placeholder: "Select order",
            type: "select",
            options:  availableOrders.map((o) => ({ label: o.ref_no, value: o.order_id.toString() })),
            disabled: isEdit
        },
        {
            name: "distribution_date",
            label: "Distribution Date",
            placeholder: "Select distribution date",
            type: "date",
            optional: true,
            disabled: isEdit
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter any remarks",
            type: "textarea",
            optional: true,
        }
    ]
}