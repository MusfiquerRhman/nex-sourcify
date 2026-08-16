export interface FactoryOrderRow {
    id: string;
    ref_no: string;
    buyer_name: string;
    factory_name: string;
    order_date: Date;
    factory_order_date: Date;
    department: string;
    approval_status: number;
}

export interface GetPDFDataOutput {
    ref_no: string;
    order_date: Date;
    buyer_name: string;
    brand_name: string;
    department_name: string;
    factory_name: string;
    season_name: string;
    currency_name: string;
    currency_symbol: string;
    rdl_currency_symbol: string; 
    rdl_currency_name: string;
    rdl_currency_rate: number;
    currency_rate: number;
    fob_type: string;
    payment_term: string;
    team_name: string;
}

export interface FactoryOrdersPoDetails {
    style: string;
    po: string;
    destination_name: string;
    product_name: string;
    color_names: string;
    size: string;
    quantity: number;
    rdl_fob: number;
    rdl_value: number;
    factory_rate: number;
    factory_value: number;
    exfactory_date: Date;
}