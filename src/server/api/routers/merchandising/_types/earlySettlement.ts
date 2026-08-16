export interface EarlySettlements {
    id: string;
    ref_no: string;
    buyer_name: string;
    total_count: bigint;
}

export interface ShipmentDetails {
    early_settlement_details_id: string;
    style: string;
    buyer_po: string;
    destination: string;
    size: string;
    order_quantity: number;
    fob_rate: number;
    early_settlement_charge: number;
    effective_rdl_fob: number;
    effective_rdl_value: number;
    factory_rate: number;
    factory_value: number;
    commission: number;
    dhaka_commission: number;
    other_commission: number;
    overseas_commission: number;
}