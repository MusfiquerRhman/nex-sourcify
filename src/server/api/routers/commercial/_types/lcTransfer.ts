export interface LcTransferListItem {
    DB_ID: string;
    LC_NO: string;
    LC_OPEN_DATE: Date;
    LC_TRANSFER_DATE: Date;
    BUYER_NAME: string;
    total_count: bigint;
}

export interface LcTransferDetails {
    lc_quantity: number;
    lc_value: number;
    lc_open_date: Date;
    lc_received_date: Date;
    lc_expire_date: Date;
    latest_shipment_date: Date;
    buyer_name: string;
    buyer_id: string;
    currency: string;
}

export interface GetSalesContractValueAndQuantity {
    sc_value : number, 
    sc_quantity: number,
    previous_transfer_quantity: number,
    previous_transfer_value: number,
}