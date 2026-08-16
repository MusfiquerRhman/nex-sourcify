export interface RdlInvoiceListItem {
    id: string;
    buyer_name: string;
    invoice_no: string;
    invoice_date: Date;
    value: number;
    symbol: string;
    is_authorized: boolean;
    total_count: bigint;
}

export interface ShipmentDetailForFactoryInvoice {
    id: string;
    order_no: string;
    styles: string;
    po: string;
    destination: string;
    order_quantity: number;
    previous_quantity: number;
    shipment_details_id: string;
    fob_rate: number;
}

export interface FactoryInvoiceForRDLInvoice {
    id: string; 
    invoice_no: string;
    total_quantity: bigint;
    factory_value: bigint; 
};

export interface FactoryInvoicePDFTableItem {
    brand: string,
    buyer_po: string,
    style: string,
    invoice_quantity: number,
    unit_price: string,
    total_price: string,
    grand_total: number,
    symbol: string;
    total_quantity: number;
}

export interface BankDetailsOfBeneficiary {
    name: string;
    account_name: string;
    account_no: string;
    branch_name: string;
    address: string;
    swift: string;
}