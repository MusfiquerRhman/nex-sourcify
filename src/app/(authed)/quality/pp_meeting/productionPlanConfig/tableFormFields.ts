import type { ProductionPlanValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ProductionPlanValues> = BaseField<T>;

export const useTableFormFields = (): Field<keyof ProductionPlanValues>[] => {
    return [
        {
            name: "color_name",
            label: "Color",
            placeholder: "Enter Color",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "po_no",
            label: "PO No.",
            placeholder: "Enter PO No",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "size",
            label: "Size",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "order_quantity",
            label: "Order Quantity",
            placeholder: "Enter Order Quantity",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "cutting_date",
            label: "Cutting Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
        },
        {
            name: "sewing_date",
            label: "Sewing Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
        },
        {
            name: "finishing_date",
            label: "Finishing Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
        },
        {
            name: "plan_inspection_date",
            label: "Plan Inspection Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
        },
    ]
}
