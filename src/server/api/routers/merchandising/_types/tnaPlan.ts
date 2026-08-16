export interface  TNATemplateType {
    id: string;
    template_name: string;
    buyer_name: string;
    ref_no: string;
    factory_name: string;
    style: string;
    plan_date: Date | null;
    total_count: bigint;
}

export interface  AdditionalDataType {
    season_name: string; 
    factory_name: string; 
    buyer_name: string; 
    brand_name: string; 
    department_name: string;
}

export interface  ActionsType {
    db_id: string;
    buyer_po: string;
    destination_name: string;
    action_name: string;
    plan_date: Date | null;
    revise_date: Date | null;
    actual_date: Date | null;
}

export interface  EventsType {
    id: string;
    order_ref: string;
    style: string;
    po: string;
    tna_templates: string;
    action_name: string;
    plan_date: Date | null;
    revise_date: Date | null;
    actual_date: Date | null;
    buyer_name: string;
    factory_name: string;
    destination_name: string;
}
