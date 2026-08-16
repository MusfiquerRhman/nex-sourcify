export interface BuyerOrderRow {
    id: string;
    buyer_name: string;
    order_date: Date;
    ref_no: string;
    department: string;
    season: string;
    team: string;
    status: boolean;
    total_count: bigint;
};

export interface GetPDFHeaderOutput {
    ref_no: string;
    order_date: Date;
    brand_name: string;
    buyer_name: string;
    department_name: string;
    factory_name: string;
    season_name: string;
    currency_name: string;
    currency_rate: number;
    currency_symbol: string;
};

export interface GetPDFPoOutput {
    style: string;
    po: string;
    destination_name: string;
    product_name: string;
    color_names: string;
    size: string;
    quantity: number;
    rdl_fob: number;
    rdl_value: number;
};