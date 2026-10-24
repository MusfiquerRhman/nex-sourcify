export interface EarlySettlements {
    id: string;
    ref_no: string;
    buyer_name: string;
    total_count: bigint;
}

export interface ShipmentDetails {
    id: string; 
    style: string;
    buyer_po: string;
    destination: string;
    size: string;
    order_quantity: number;
    fob_rate: number;
    rdl_value: number;
    early_settlement_charge: number;
    effective_rdl_fob: number;
    effective_rdl_value: number;
    factory_rate: number;
    factory_value: number;
    commission_percentage: number;
    effective_commission_percentage: number;
    commission_value: number;
    effective_commission: number;
    dhaka_commission_percentage: number;
    effective_dhaka_commission_percentage: number;
    dhaka_value: number;
    effective_dhaka_value: number;
    overseas_commission_percentage: number;
    overseas_value: number;
    effective_overseas_value: number;
    other_commission_percentage: number;
    other_value: number;
    effective_other_value: number;
    symbol: string;
}
