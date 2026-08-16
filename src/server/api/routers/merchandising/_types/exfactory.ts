export interface Exfactory {
    id: string;
    exfactory_no: string;
    exfactory_date: Date;
    buyer_name: string;
    factory_name: string;
    is_authorized: boolean;
    pos: string;
    styles: string;
    total_count: bigint;
}

export interface ExfactoryShipments {
    shipment_detail_id: string;
    po: string;
    style: string;
    destination: string;
    colors: string;
    lot_quantity: string;
    previous_shipment_quantity: string;
    shipment_quantity: number;
    db_id: string;
    shipment_mode: string;
    po_close: boolean;
}

export interface PendingExFactory {
    order_id: string;
    buyer_name: string;
    factory_name: string;
    order_ref: string;
    style: string;
    po: string;
    exfactory_date: Date;
    total_quantity: string;
    total_delivery_quantity: string;
    ex_factory_date: Date;
    total_count: bigint;
}