export interface ProceedRealizationResult {
    id: string;
    buyer_name: string;
    fdbc_no: string;
    term_name: string;
    realization_date: Date;
    realized_amount: number;
    added_at: Date;
    total_count: number;
}

export interface RdlInvoiceDetailsResult {
    rdl_invoice_id: string;
    rdl_invoice_no: string;
    invoice_value: number;
}
