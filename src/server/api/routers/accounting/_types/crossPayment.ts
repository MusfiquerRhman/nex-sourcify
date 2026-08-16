export interface CrossPaymentDetails {
    db_id: string;
    factory_name: string;
    factory_invoice_id: string;
    factory_invoice_no: string;
    factory_invoice_date: string;
    invoice_quantity: number;
    invoice_value: number;
}

export interface CrossPaymentList {
    id: string;
    cross_payment_ref: string;
    cross_payment_date: Date;
    buyer_name: string;
    term_name: string;
    paid_amount: number;
    is_authorized: boolean;
    added_at: Date;
    total_count: number;
}