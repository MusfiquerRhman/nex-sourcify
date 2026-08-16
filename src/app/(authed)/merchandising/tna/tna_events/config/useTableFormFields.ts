import type { ActionFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { useDecodedUser } from "~/hooks";

export type Field<T extends keyof ActionFormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof ActionFormValues>[] => {
    const { isAdmin } = useDecodedUser();

    return [
        {
            name: "checked",
            label: "Checked",
            placeholder: "Check this box",
            type: "checkbox"
        },
        {
            name: "order_ref",
            label: "Order Reference",
            placeholder: "Enter order reference",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "style",
            label: "Style",
            placeholder: "Enter style",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "po",
            label: "PO",
            placeholder: "Enter PO",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "action_name",
            label: "Action Name",
            placeholder: "Enter action name",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "plan_date",
            label: "Plan Date",
            placeholder: "Select plan date",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "revise_date",
            label: "Revise Date",
            placeholder: "Select revise date",
            type: "date",
        },
        {
            name: "actual_date",
            label: "Actual Date",
            placeholder: "Select actual date",
            type: "date",
            minDate: isAdmin ? undefined : 2
        },
        {
            name: "template_name",
            label: "Template Name",
            placeholder: "Enter template name",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "buyer_name",
            label: "Buyer Name",
            placeholder: "Enter buyer name",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            type: "text",
            optional: true,
            disabled: true,
        },
        {
            name: "destination_name",
            label: "Destination Name",
            placeholder: "Enter destination name",
            type: "text",
            optional: true,
            disabled: true,
        }
    ]
}