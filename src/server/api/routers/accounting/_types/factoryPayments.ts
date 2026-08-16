interface FactoryPayments {
    term_name: string;
    fdbc_no: string;
    realization_date: Date;
    rdl_invoice_value: string;
    realized_amount: number;
    factory_paid_amount: number;
}

export interface FactoryPaymentResult extends FactoryPayments {
    id: string;
    paid_count: number;
    pending_count: number;
    total_count: bigint;
}

export interface FactoryPaymentDetailsById extends FactoryPayments {
    remarks: string | null;
}

export interface FactoryPaymentDetails {
    db_id: string;
    factory_name: string;
    factory_invoice_id: string;
    factory_invoice_no: string;
    fdbc_no: string;
    factory_invoice_date: Date;
    invoice_quantity: number;
    invoice_value: number;
    paid_amount: number | null;
    payment_date: Date | null;
    is_cross_paid: boolean | null;
    factory_payment_no: string | null;
}

export interface GetCrossPaymentByIdTypes {
    factory_payment_detail_id: string;
    factory_invoice_id: string;
    factory_invoice_no: string;
    factory_name: string;
    factory_payment_no: string;
    factory_payment_date: Date;
    paid_amount: number;
    regularized: boolean;
}
