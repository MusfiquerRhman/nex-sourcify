export interface LCListItem {
    id: string;
    factory_name: string;
    debit_note_ref: string;
    term_name: string;
    lc_sc_no: string;
    buyer_name: string;
    debit_note_date: Date;
    total_count: number;
}

export interface ShipmentDetails { 
    id: string; 
    buyer_po: string; 
    invoice_no: string; 
    dn_value: number 
}

export interface DebitNoteHeader {
    debit_note_ref: string;
    debit_note_date: Date;
    factory_name: string;
    factory_address: string;
    processing_charge: number;
    conversion_rate: number;
    additional_adjustment: number;
    less: number;
    lc_no: string;
    lc_open_date: Date;
}

export interface DebitNoteTableData {
    buyer_po: string;
    quantity: number;
    factory_rate: number;
    transfer_rate: number;
    margin: number;
    excess_value: number;
    symbol: string;
}