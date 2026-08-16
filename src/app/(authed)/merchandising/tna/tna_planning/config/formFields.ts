import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

type Props = {
    orders: { id: string; ref_no: string }[];
    styles: { id: string; style: string }[];
    templates: { id: string; template_name: string }[];
    isEdit: boolean;
};

export const formFields = (props: Props): Field<keyof FormValues>[] => {
    const { orders, styles, templates, isEdit } = props;

    return [
        {
            name: "buyer_order_id",
            label: "Buyer Order",
            type: "select",
            options: orders?.map(order => ({
                value: order.id,
                label: order.ref_no,
            })) ?? [],
            disabled: isEdit, // disable order selection in edit mode
            optional: isEdit, // make it optional in edit mode since we won't change it
        },
        {
            name: "style_id",
            label: "Style",
            type: "select",
            options: styles?.map(style => ({
                value: style.id,
                label: style.style,
            })) ?? [],
            disabled: isEdit, // disable style selection in edit mode
            optional: isEdit, // make it optional in edit mode since we won't change it
        },
        {
            name: "tna_template_id",
            label: "Template",
            type: "select",
            options: templates?.map(template => ({
                value: template.id,
                label: template.template_name,
            })) ?? [],
            disabled: isEdit, // disable template selection in edit mode
            optional: isEdit, // make it optional in edit mode since we won't change it
        },
        {
            name: "plan_date",
            label: "Plan Date",
            type: "date",
            disabled: true,
            optional: true,
        },
        {
            name: 'buyer_name',
            label: 'Buyer Name',
            type: 'text',
            disabled: true,
            optional: true, 
        },
        {
            name: 'factory_name',
            label: 'Factory Name',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'brand_name',
            label: 'Brand',
            type: 'text',
            disabled: true,
             optional: true,
        },
        {
            name: 'department_name',
            label: 'Department',
            type: 'text',
            disabled: true,
             optional: true,
        },
        {
            name: 'season_name',
            label: 'Season',
            type: 'text',
            disabled: true,
            optional: true,
        }
    ];
};

