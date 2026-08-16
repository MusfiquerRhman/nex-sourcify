export interface LcResponse {
    id: number;
    lc_no: string;
    lc_open_date: Date;
    lc_value: string;
    status: string;
    added_at: Date;
    currency_symbol: string;
    total_count: bigint;
}

export interface LcDetailsResponse {
    shipment_details_id: string;
    status: boolean;
    style: string;
    po: string;
    factory_name: string;
    exfactory_date: Date;
    destination: string;
    quantity: number;
    rdl_fob: number;
    rdl_value: number;
    factory_transfer_value: number;
}