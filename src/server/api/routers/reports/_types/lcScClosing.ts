export interface LcScClosingHeader {
    lc_no: string;
    buyer_name: string;
    order_quantity: number;
    value: number;
    secondary_value: number;
    symbol: string;
}

export interface LcScTableData {
    min_exfactory_date: Date;
    max_exfactory_date: Date;
    export_invoice_quantity: number;
    rdl_export_value: number;
    rdl_export_value_usd: number;
    factory_export_value: number;
    symbol: string;
    debit_note: string;
    realized_amount: number;
    factory_paid_amount: number;
}

export interface Charges {
    bank_charge: number;
    document_charge: number;
    discount_charge: number;
}

export interface ClaimAdjustment {
    claim_adjustment: number;
}

export interface DebitNotes {
    debit_note_ref: string;
    debit_note_date: Date;
    debit_note_value: number;
    factory_name: string;
}