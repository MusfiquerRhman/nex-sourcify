export interface DocumentSubmissions {
    id: string;
    term: string;
    buyer_name: string;
    fdbc_no: string;
    fdbc_value: number;
    submission_date: Date;
    added_at: Date;
    awb_no: string;
    total_count: bigint;
}

export interface RDLInvoice {
    id: string,
    invoice_no: string,
    total_quantity: bigint,
    total_value: bigint,
    invoice_date: Date,
    previous_value: bigint,
}

export interface FactoryInvoiceDetails {
    risdid: string,
    factory_name: string,
    factory_invoice_id: string,
    factory_invoice_no: string,
    invoice_date: Date,
    factory_invoice_value: bigint,
    quantity: bigint,
}