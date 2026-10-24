type HistoryActor = {
    action_by: string;
    action_at?: string;
};

type OrderSnapshot = {
    order_id: string;
    dm_pi_no: string | null;
};

// This payload contract is also used by the dedicated history worker.
export type HistoryLookupJob =
    | {
        name: "cross_payment_details_added";
        data: HistoryActor & {
            cross_payment_id: string;
            details: {
                factory_invoice_id: string;
                factory_payment_no: string | null;
                factory_payment_date: Date | string | null;
                value: number;
            }[];
        };
    }
    | {
        name: "debit_note_details_added";
        data: HistoryActor & {
            debit_note_header_id: string;
            exfactory_shipment_ids: string[];
        };
    }
    | {
        name: "proceed_realization_details_added";
        data: HistoryActor & {
            realization_id: string;
            rdl_invoice_ids: string[];
        };
    }
    | {
        name: "sales_contract_details_added";
        data: HistoryActor & {
            sales_contract_id: string;
            order_ids: string[];
            row_ids?: string[];
        };
    }
    | {
        name: "sales_contract_amendment_details_added";
        data: HistoryActor & {
            sales_contract_amendment_id: string;
            order_ids: string[];
        };
    }
    | {
        name: "lc_orders_added";
        data: HistoryActor & {
            lc_master_id: string | null;
            orders: OrderSnapshot[];
            row_ids?: string[];
        };
    }
    | {
        name: "lc_amendment_orders_added";
        data: HistoryActor & {
            lc_amendment_id: string;
            orders: OrderSnapshot[];
        };
    };
