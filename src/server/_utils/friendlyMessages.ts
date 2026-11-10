const genericForeignKeyMessage = "This record is referenced by another record and cannot be deleted.";

const specificFriendlyMessages: Record<string, string> = {
    sales_contract_amendment_sales_contract_id_fkey:
        "This sales contract has amendments and cannot be deleted.",
    sales_contract_amendment_detai_sales_contract_amendment_id_fkey:
        "This sales contract amendment has detail records and cannot be deleted.",
    sales_contract_consignees_sales_contract_id_fkey:
        "This sales contract has consignee records and cannot be deleted.",
    sales_contract_contact_details_sales_contract_id_fkey:
        "This sales contract has linked order details and cannot be deleted.",

    lc_amendment_lc_id_fkey:
        "This LC has amendments and cannot be deleted.",
    lc_orders_lc_master_id_fkey:
        "This LC has linked orders and cannot be deleted.",
    lc_shipments_lc_order_id_fkey:
        "This LC order has shipments and cannot be deleted.",
    lc_transfer_lc_master_id_fkey:
        "This LC has transfer records and cannot be deleted.",
    lc_amendment_shipments_shipment_details_id_fkey:
        "This shipment has amendments and cannot be deleted.",
    lc_shipments_shipment_details_id_fkey:
        "This shipment is linked to an LC and cannot be deleted.",

    shipment_details_fk:
        "This shipment is linked to a factory shipment and cannot be deleted.",
    exfactory_shipments_shipment_details_id_fkey:
        "This shipment has an ex-factory record and cannot be deleted.",
    commission_distributions_details_shipment_details_id_fkey:
        "This shipment has commission distribution records and cannot be deleted.",
    early_settlement_details_shipment_details_id_fkey:
        "This shipment is used in an early settlement and cannot be deleted.",
    rdl_invoice_shipment_details_shipment_details_id_fkey:
        "This shipment is included in a Nex-Sourcify invoice and cannot be deleted.",
    tna_plan_details_shipment_id_fkey:
        "This shipment has TNA planning records and cannot be deleted.",
    shipment_item_details_shipment_detail_id_fkey:
        "This shipment still has item details and cannot be deleted.",

    order_styles_order_id_fkey:
        "This buyer order still has styles and cannot be deleted.",
    shipment_details_order_style_id_fkey:
        "This style still has shipments and cannot be deleted.",
    factory_orders_order_id_fkey:
        "This buyer order has factory orders and cannot be deleted.",
    sales_contract_amendment_details_order_id_fkey:
        "This buyer order is used in a sales contract amendment and cannot be deleted.",
    sales_contract_contact_details_order_id_fkey:
        "This buyer order is linked to a sales contract and cannot be deleted.",
    lc_orders_order_id_fkey:
        "This buyer order is linked to an LC order and cannot be deleted.",
    lc_amendment_orders_order_id_fkey:
        "This buyer order is linked to an LC amendment and cannot be deleted.",
    commission_distributions_order_id_fkey:
        "This buyer order has commission distribution records and cannot be deleted.",
    tna_plans_order_id_fkey:
        "This buyer order has TNA plans and cannot be deleted.",

    factory_order_fk:
        "This factory order has shipment details and cannot be deleted.",
    exfactory_orders_order_id_fkey:
        "This buyer order has an ex-factory order and cannot be deleted.",
    exfactory_shipments_exfactory_orders_id_fkey:
        "This ex-factory order has shipments and cannot be deleted.",
    factory_invoice_details_exfactory_shipment_id_fkey:
        "This ex-factory shipment is used in a factory invoice and cannot be deleted.",
    debit_note_details_exfactory_shipment_id_fkey:
        "This ex-factory shipment is used in a debit note and cannot be deleted.",

    factory_invoice_sales_contract_id_fkey:
        "This sales contract is used in a factory invoice and cannot be deleted.",
    factory_invoice_lc_id_fkey:
        "This LC is used in a factory invoice and cannot be deleted.",
    factory_payments_factory_invoice_id_fkey:
        "This factory invoice has payment records and cannot be deleted.",
    factory_payments_rdl_invoice_id_fkey:
        "This Nex-Sourcify invoice has factory payment records and cannot be deleted.",
    factory_payment_header_rdl_invoice_id_fkey:
        "This Nex-Sourcify invoice has payment records and cannot be deleted.",
    commission_invoice_sales_contract_id_fkey:
        "This sales contract is used in a commission invoice and cannot be deleted.",
    commission_invoice_lc_id_fkey:
        "This LC is used in a commission invoice and cannot be deleted.",
    commission_invoice_rdl_invoice_id_fkey:
        "This Nex-Sourcify invoice is used in a commission invoice and cannot be deleted.",
    debit_note_sales_contract_id_fkey:
        "This sales contract is used in a debit note and cannot be deleted.",
    debit_note_lc_id_fkey:
        "This LC is used in a debit note and cannot be deleted.",
    rdl_invoice_sales_contract_id_fkey:
        "This sales contract is used in a Nex-Sourcify invoice and cannot be deleted.",
    rdl_invoice_lc_id_fkey:
        "This LC is used in a Nex-Sourcify invoice and cannot be deleted.",
};

export const friendlyMessages: Record<string, string> = new Proxy(
    specificFriendlyMessages,
    {
        get(messages, constraint: string) {
            return messages[constraint] ?? genericForeignKeyMessage;
        },
    },
);