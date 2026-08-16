import { api } from "~/trpc/react";
import type { CommissionInvoiceFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CommissionInvoiceFormValues> = BaseField<T>;

interface LCListItem {
    id: string;
    sc_lc_no: string;
}

interface FdbcRdlInvoiceListItem {
    id: string;
    fdbc_rdl_invoice_no: string;
}

interface CompanyBankListItem {
    id: string;
    bank_name: string;
}

interface PropsType {
    lcScList: LCListItem[];
    isEdit: boolean;
    fdbcRdlInvoiceList: FdbcRdlInvoiceListItem[];
    companyBankList: CompanyBankListItem[];
}

export const useFormFields = ({lcScList, isEdit, fdbcRdlInvoiceList, companyBankList}: PropsType): Field<keyof CommissionInvoiceFormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    return [
        {
            name: "ref_no",
            label: "Reference No",
            type: "text",
            optional: true,
            disabled: true
        },
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
            name: "invoice_date",
            label: "Invoice Date",
            type: "date",
            optional: true
        },
        {
            name: "lc_sc_id",
            label: "LC/Sales Contract No",
            type: "select",
            options: lcScList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "fdbc_rdl_invoice_id",
            label: "FDBC/Invoice No",
            type: "select",
            options: fdbcRdlInvoiceList.map((invoice) => ({ label: invoice.fdbc_rdl_invoice_no, value: invoice.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: 'company_bank_id',
            label: 'Company Bank',
            type: "select",
            options: companyBankList.map((bank) => ({ label: bank.bank_name, value: bank.id })),
            disabled: isEdit,
            optional: isEdit
        },
    ]
}