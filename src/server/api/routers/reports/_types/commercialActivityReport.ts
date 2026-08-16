export interface PoWiseData {
    buyer_name: string;
    factory_name: string;
    buyer_po: string;
    exfactory_nos: string;
    exfactory_dates: string;
    shipment_quantity: number;
    factory_invoice: string;
    factory_invoice_date: string;
    factory_invoice_quantity: number;
    factory_invoice_value: number;
    lc_no: string;
    sales_contract_no: string;
    rdl_invoice: string;
    rdl_invoice_date: string;
    rdl_invoice_quantity: number;
    rdl_invoice_value: number;
    fdbc_no: string;
    fdbc_date: string;
}

export interface CiAndRealizationData {
    buyer_name: string;
    exfactory_dates: string;
    rdl_invoice: string;
    rdl_invoice_date: string;
    rdl_invoice_quantity: number;
    rdl_invoice_value: number;
    fdbc_no: string;
    document_submission_date: string;
    ci_no: string;
    ci_date: string;
    realized_amount: number;
    realized_date: string;
}

export interface FactoryInvoiceData {
    buyer_name: string;
    exfactory_dates: string;
    factory_name: string;
    lc_no: string;
    sales_contract_no: string;
    factory_invoice: string;
    factory_invoice_date: string;
    factory_invoice_quantity: number;
    factory_invoice_value: number;
    FDBC_NO: string;
    factory_payment: number;
    FACTORY_PAYMENT_DATE: string;
}
