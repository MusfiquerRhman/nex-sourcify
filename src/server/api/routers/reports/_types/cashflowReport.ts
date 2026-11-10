export interface CashflowReport {
    buyer_name: string;
    ci_no: string;
    invoice_date: Date | null;
    total_ci: number | null;
    calc_shipment_date: Date | null;
    term_days: number | null;
    buffer_days: number;
    calc_remit_date: Date | null;
    remit_week: string;
    remit_month: string;
    days_overdue: number | null;
    aging_slab: string;
}
