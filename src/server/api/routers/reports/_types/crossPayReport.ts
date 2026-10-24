export interface CrossPayReport {
    cross_payment_ref: string;
    cross_payment_date: string;
    buyer_name: string;
    payment_term: string;
    factory_name: string;
    invoice_no: string;
    invoice_date: string;
    factory_invoice_quantity: number;
    factory_invoice_value: number;
    factory_payable_value: number;
    factory_payment_no: string;
    factory_payment_date: string;
    fdbc_no: string;
    realization_date: string;
    rdl_invoice_no: string;
    rdl_invoice_date: string;
    rdl_invoice_quantity: number;
    rdl_invoice_value: number;
    regularization_date: string;
}