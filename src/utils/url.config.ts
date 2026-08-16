import { 
    dashboardIcon, sackDollarIcon, reportIcon, shirtIcon, bookIcon, accountsIcon, 
    adminIcon, qualityIcon, complianceIcon, settingIcon, codeIcon
} from "~/assets";

import type { StaticImageData } from "next/image";
import { m } from './moduleMap'

// Database ID to Icon mapping
export const icons: Record<string, StaticImageData> = {
    [m.DASHBOARD]: dashboardIcon,
    [m.LIBRARY]: bookIcon,
    [m.MERCHANDISING]: shirtIcon,
    [m.COMMERCIAL]: sackDollarIcon,
    [m.ACCOUNTING]: accountsIcon,
    [m.QUALITY]: qualityIcon,
    [m.COMPLIANCE]: complianceIcon,
    [m.ADMIN]: adminIcon,
    [m.REPORTS]: reportIcon,
    [m.SYSTEM]: settingIcon,
    [m.MAINTENANCE]: codeIcon
};

// Database ID to URL mapping
const sideBarConfig: Record<number, {href: string;}> = {
    [m.DASHBOARD]: { href: "/dashboard" },

    // Library Module
    [m.LIBRARY]: { href: "/library" },
    [m.COMPANIES]: { href: "/library/companies" },
    [m.OVERSEAS_OFFICES]: { href: "/library/overseas_offices" },
    [m.BANKS]: { href: "/library/banks" },
    [m.BUYERS]: { href: "/library/buyers" },
    [m.PRODUCT_TYPES]: { href: "/library/product_types" },
    [m.PRODUCTS]: { href: "/library/products" },
    [m.FABRICS]: { href: "/library/fabrics" },
    [m.FABRIC_SUPPLIER]: { href: "/library/fabric_supplier" },
    [m.SEASON]: { href: "/library/season" },
    [m.COLORS]: { href: "/library/colors" },
    [m.FACTORIES]: { href: "/library/factories" },
    [m.DESTINATIONS]: { href: "/library/destinations" },
    [m.COURIERS]: { href: "/library/couriers" },
    [m.TNA_ACTIONS]: { href: "/library/tna_actions" },
    [m.COUNTRIES]: { href: "/library/countries" },
    [m.CURRENCIES]: { href: "/library/currencies" },
    [m.FOB_TYPES]: { href: "/library/fob_types" },
    [m.PAYMENT_TERMS]: { href: "/library/payment_terms" },
    [m.FREIGHT_TERMS]: { href: "/library/freight_terms" },
    
    // System
    [m.TNA_BASE_ACTION]: { href: "/system/tna_base_action" },
    [m.SHIPMENT_TOLERANCE]: { href: "/system/shipment_tolerance" },
    [m.LIBRARY_COMMISSION_DISTRIBUTION]: {href: "/system/commission_percentage" },
    [m.HANDOVER_DATES]: { href: "/system/handover_dates" },
    [m.EARLY_SETTLEMENT_PERCENTAGE]: {href: "/system/early_settlement_percentage" },
    [m.SC_CONTACT_PERSON]: { href: "/system/sc_contact_person" },

    // Merchandising Module
    [m.MERCHANDISING]: { href: "/merchandising" },
    [m.BUYER_ORDERS]: { href: "/merchandising/buyer_orders" },
    [m.FACTORY_ORDERS]: { href: "/merchandising/factory_orders" },
    [m.COMMISSION_DISTRIBUTION]: { href: "/merchandising/commission_distribution" },
    [m.TNA]: { href: "/merchandising/tna" },
    [m.TNA_TEMPLATES]: { href: "/merchandising/tna/tna_templates" },
    [m.TNA_PLANNING]: { href: "/merchandising/tna/tna_planning" },
    [m.TNA_EVENTS]: { href: "/merchandising/tna/tna_events" },
    [m.SALES_CONTRACT]: { href: "/merchandising/sales_contract" },
    [m.SALES_CONTRACTS]: { href: "/merchandising/sales_contract/sales_contracts" },
    [m.SALES_CONTRACT_AMENDMENTS]: { href: "/merchandising/sales_contract/sales_contract_amendments" },
    [m.LC]: { href: "/merchandising/lc" },
    [m.LC_MASTER]: { href: "/merchandising/lc/lc_master" },
    [m.LC_AMENDMENTS]: { href: "/merchandising/lc/lc_amendments" },
    [m.EX_FACTORY]: { href: "/merchandising/ex_factory" },
    [m.PENDING_EX_FACTORIES]: { href: "/merchandising/ex_factory/pending_ex_factories" },
    [m.EX_FACTORIES]: { href: "/merchandising/ex_factory/ex_factories" },
    [m.EARLY_SETTLEMENT] : { href: "/merchandising/early_settlement" },

    // Admin Module
    [m.ADMIN]: { href: "/admin" },
    [m.USERS]: { href: "/admin/users" },
    [m.PERMISSIONS]: { href: "/admin/permissions" },
    [m.TEAMS]: { href: "/admin/teams" },
    [m.AUTHORIZATIONS]: { href: "/admin/authorizations" },
    [m.EV_PERMISSIONS]: { href: "/admin/ev_permissions" },

    // Commercial Module
    [m.COMMERCIAL]: { href: "/commercial" },
    [m.LC_TRANSFER]: { href: "/commercial/lc_transfer" },
    [m.FACTORY_INVOICE]: { href: "/commercial/factory_invoice" },
    [m.COMMERCIAL_TNA]: { href: "/commercial/tna" },
    [m.TNA_TEMPLATES_COMMERCIAL]: { href: "/commercial/tna/tna_templates" },
    [m.TNA_PLANNING_COMMERCIAL]: { href: "/commercial/tna/tna_planning" },
    [m.RDL_INVOICE]: { href: "/commercial/rdl_invoice" },
    [m.DOCUMENT_SUBMISSION]: { href: "/commercial/document_submission" },

    // Accounting Module
    [m.ACCOUNTING]: { href: "/accounting" },
    [m.COMMISSION_INVOICE]: { href: "/accounting/commission_invoice" },
    [m.PROCEED_REALIZATION]: { href: "/accounting/proceed_realization" },
    [m.FACTORY_PAYMENT]: { href: "/accounting/factory_payment" },
    [m.REGULAR_PAYMENT]: { href: "/accounting/factory_payment/regular_payment" },
    [m.CROSS_PAYMENT]: { href: "/accounting/factory_payment/cross_payment" },
    [m.DEBIT_NOTE]: { href: "/accounting/debit_note" },
    [m.COMMISSION_REALIZATION]: { href: "/accounting/commission_realization" },

    // Reports Module
    [m.REPORTS]: { href: "/reports" },
    [m.SALES_REPORT]: { href: "/reports/mer_report/sales_report" },
    [m.EXPORT_REPORT]: { href: "/reports/mer_report/export_report" },
    [m.ORDER_SUMMARY_REPORT]: { href: "/reports/mer_report/order_summary_report" },
    [m.EXPORT_SUMMARY]: { href: "/reports/com_report/export_summary" },
    [m.LC_SC_CLOSING]: { href: "/reports/com_report/lc_sc_closing" },
    [m.COMMERCIAL_ACTIVITY_REPORT]: { href: "/reports/com_report/activity_report" },

    // Maintenance
    [m.ERROR_LOGS]: { href: "/maintenance/error_logs" },
    [m.USER_SESSIONS]: { href: "/maintenance/user_sessions" },
};

export default sideBarConfig;
