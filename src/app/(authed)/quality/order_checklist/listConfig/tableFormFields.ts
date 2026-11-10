import { useDecodedUser } from "~/hooks";
import type { OrderFormDetailsValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";
import { safeNumber } from "~/utils/numbers";
import { technicalCheckOptions } from "~/utils/orderChecklist";

export type Field<T extends keyof OrderFormDetailsValues> = BaseField<T>;

export const useTableFormFields = (): Field<keyof OrderFormDetailsValues>[] => {
    const { user, isAdmin } = useDecodedUser();

    const isTechnicalUser = safeNumber(user?.department_id) === 7;
    const isQaUser = safeNumber(user?.department_id) === 4;

    return [
        {
            name: "serial_no",
            label: "SL",
            placeholder: "Enter Style",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "document_details",
            label: "Document Details",
            placeholder: "Enter Document details",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "technical_check",
            label: "Technical",
            type: 'select',
            options: technicalCheckOptions,
            optional: true,
            disabled: !(isTechnicalUser || isAdmin)
        },
        {
            name: "technical_remarks",
            label: "Remarks",
            placeholder: "Enter Remarks",
            type: 'textarea',
            optional: true,
            disabled: !(isTechnicalUser || isAdmin)
        },
        {
            name: "technical_check_date",
            label: "Technical Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
            disabled: true,
        },
        {
            name: "qa_check",
            label: "QA",
            placeholder: "QA",
            type: 'checkbox',
            optional: true,
            disabled: !(isQaUser || isAdmin)
        },
        {
            name: "qa_remarks",
            label: "Remarks",
            placeholder: "Enter Remarks",
            type: 'textarea',
            optional: true,
            disabled: !(isQaUser || isAdmin)
        },
        {
            name: "qa_check_date",
            label: "QA Date",
            placeholder: "Enter Date",
            type: 'date',
            optional: true,
            disabled: true,
        },
    ]
}
