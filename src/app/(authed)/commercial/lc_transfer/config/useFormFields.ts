/**
 * @description
 * This file defines the form fields for the LC Transfer form, which are used to render the input fields for the LC Transfer form dynamically.
 * The form fields include LC number, buyer name, LC open date, LC transfer date, currency name, LC receive date, last shipment date, LC expire date, LC quantity, LC value, and remarks.
 * The LC number field is a select field that is populated with the list of available LCs for transfer, while the other fields are either text or date fields that are populated based on the selected LC and are disabled for editing.
 * The form fields are defined in a way that allows for easy extension and modification in the future, as new fields can be added or existing fields can be modified without affecting the overall structure of the form.
 * The useFormFields hook takes in the list of available LCs and a boolean indicating whether the form is in edit mode, and returns an array of form field configurations that can be used to render the form fields dynamically in the LC Transfer form.
 */

import type { LCTransferFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof LCTransferFormValues> = BaseField<T>;

interface LCListItem {
    lc_id: string;
    lc_no: string;
}

export const useFormFields = ({lcList, isEdit}: {lcList: LCListItem[], isEdit: boolean}): Field<keyof LCTransferFormValues>[] => {
    return [
        {
            name: 'lc_id',
            label: 'LC No',
            type: "select",
            options: lcList.map((lc) => ({ label: lc.lc_no, value: lc.lc_id })),
            disabled: isEdit, // Disable LC selection in edit mode
            optional: isEdit,
        },
        {
            name: "lc_transfer_date",
            label: "Transfer Date",
            placeholder: "Select transfer date",
            type: "date",
        },
        {
            name: "lc_open_date",
            label: "LC Open Date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "lc_receive_date",
            label: "LC Receive Date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "last_shipment_date",
            label: "Last Shipment Date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "lc_expire_date",
            label: "LC Expire Date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "buyer_name",
            label: "Buyer Name",
            disabled: true,
            optional: true
        },
        {
            name: 'currency_name',
            label: 'Currency',
            type: "text",
            disabled: true,
            optional: true
        }, 
        {
            name: "lc_quantity",
            label: "LC Quantity",
            type: "text",
            disabled: true,
            optional: true
        },
        {
            name: "lc_value",
            label: "LC Value",
            type: "text",
            disabled: true,
            optional: true
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}