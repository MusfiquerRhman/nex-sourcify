export interface FactoryInvoiceListItem {
    id: string;
    factory_name: string;
    buyer_name: string;
    invoice_no: string;
    invoice_date: Date;
    value: number;
    symbol: string;
    added_at: Date;
    total_count: bigint;
}

interface ShipmentBase {
    order_no: string;
    style: string;
    po: string;
    exfactory_date: Date;
    destination: string;
    order_quantity: number;
    delivery_quantity: number;
    factory_fob: number;
    factory_value: number;
}

export interface ScLcListItem extends ShipmentBase {
    id: string;
}

export type ExfactoryShipmentDetails = ShipmentBase;

export interface FactoryInvoicePDFTableItem {
    brand: string,
    buyer_po: string,
    style: string,
    delivery_quantity: number,
    unit_price: string,
    total_price: string,
    grand_total: number,
    symbol: string;
    total_quantity: number;
}
