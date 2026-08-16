import { api } from "~/trpc/react";
import type { DocumentSubmissionFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof DocumentSubmissionFormValues> = BaseField<T>;

interface LCListItem {
    id: string;
    sc_lc_no: string;
}

interface PropsType {
    lcList: LCListItem[];
    isEdit: boolean;
}

export const useFormFields = ({lcList, isEdit}: PropsType): Field<keyof DocumentSubmissionFormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const couriers = api.courier.getAllCouriers.useQuery().data ?? [];

    return [
        {
            name: "term_id",
            label: "Select Payment Term",
            placeholder: "Select payment term",
            type: "select",
            options: terms.map((term) => ({ label: term.name, value: term.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "submission_date",
            label: "Submission Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "fdbc_no",
            label: "FDBC/TT No",
            type: "text",
            optional: isEdit,
            disabled: isEdit
        },
        {
            name: "fdbc_value",
            label: "FDBC/TT Value",
            type: "number",
            optional: true,
        },
        {
            name: "fdbc_date",
            label: "FDBC/TT Date",
            type: "date",
        },
        {
            name: "lc_sc_id",
            label: "Select LC/SC",
            type: "select",
            options: lcList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "lc_sc_date",
            label: "LC/SC Date",
            type: "date",
            disabled: true,
            optional: true,
        },
        {
            name: "bank_name",
            label: "Bank Name",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "awb_no",
            label: "AWB No",
            type: "text",
            optional: true,
        },
        {
            name: "awb_date",
            label: "AWB Date",
            type: "date",
            optional: true,
        },
        {
            name: 'courier_id',
            label: 'Courier',
            type: "select",
            options: couriers.map((courier) => ({ label: courier.name, value: courier.id })),
            optional: true,
        },
    ]
}