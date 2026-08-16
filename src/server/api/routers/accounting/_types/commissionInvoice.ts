export interface CommissionInvoiceListItem {
    id: string,
    term: string,
    buyer_name: string,
    invoice_date: Date,
    ref_no: string,
    lc_sc_no: string | null,
    fdbc_rdl_invoice_no: string | null,
    total_count: bigint,
    added_at: Date,
}

export interface PDFHeaderData {
    term_name: string,
    ref_no: string,
    invoice_date: Date,
    buyer_name: string,
    bank_name: string,
    lc_no: string | null,
    sales_contract_no: string | null,
    lc_exfactory_date: Date | null,
    sc_exfactory_date: Date | null,
    fdbc_no: string | null,
}

export interface RDLInvoiceData {
    term_name: string,
    rfl_invoice_no: string,
    rfl_invoice_date: Date,
    rfl_invoice_quantity: number,
    rfl_invoice_value: number,
    rft_invoice_no: string,
    rft_invoice_date: Date,
    rft_invoice_quantity: number,
    rft_invoice_value: number
}

export interface FactoryInvoiceData {
    term_name: string,
    rfl_invoice_no: string,
    rfl_invoice_date: Date,
    rfl_invoice_quantity: number,
    rfl_invoice_value: number,
    rfl_factory_name: string
    rft_invoice_no: string,
    rft_invoice_date: Date,
    rft_invoice_quantity: number,
    rft_invoice_value: number
    rft_factory_name: string
}

export interface CommissionDistributionData {
    cfl_dhaka_value: number,
    cfl_overseas_value: number,
    cfl_other_value: number,
    cfl_dhaka_percentage: number,
    cfl_overseas_percentage: number,
    cfl_other_percentage: number,
    cft_dhaka_value: number,
    cft_overseas_value: number,
    cft_other_value: number,
    cft_dhaka_percentage: number,
    cft_overseas_percentage: number,
    cft_other_percentage: number,
    cfl_dn_dhaka_value: number,
    cfl_dn_overseas_value: number,
    cfl_dn_other_value: number,
    cfl_dn_dhaka_percentage: number,
    cfl_dn_overseas_percentage: number,
    cfl_dn_other_percentage: number,
    cft_dn_dhaka_value: number,
    cft_dn_overseas_value: number,
    cft_dn_other_value: number,
    cft_dn_dhaka_percentage: number,
    cft_dn_overseas_percentage: number,
    cft_dn_other_percentage: number
}
