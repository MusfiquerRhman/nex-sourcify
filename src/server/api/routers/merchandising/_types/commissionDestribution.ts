export interface CommissionDistribution {
    id: string;
    ref_no: string;
    buyer_name: string;
    plan_date: Date;
    approval_status: string;
    total_count: bigint;
}

export interface CommissionDistributionDetail {
    db_id: string;
    style: string;
    po: string;
    destination: string;
    size: string;
    order_quantity: number;
    rdl_fob: number;
    factory_fob: number;
    rdl_value: number;
    factory_value: number;
    margin_per_piece: number;
    commission_value: number;
    commission_percentage: number;
    dhaka_commission_percentage: number;
    overseas_commission_percentage: number;
    others_commission_percentage: number;
}

export interface PDFHeader {
    ref_no: string;
    buyer_name: string;
    order_date: Date;
}

export interface PDFDetail {
    style: string;
    buyer_po: string;
    order_quantity: number;
    rdl_fob: number;
    rdl_value: number;
    factory_fob: number;
    factory_value: number;
    commission_percentage: number;
    commission_value: number;
    dhaka_commission: number;
    overseas_commission: number;
    others_commission: number;
}
