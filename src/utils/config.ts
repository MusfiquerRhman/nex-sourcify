// TNA action ids
export const ETD_DATE_DB_ID = 41;
export const HANDOVER_DATE_DB_ID = 40;
export const FACTORY_INVOICE = 42;
export const ACTUAL_EXFACTORY_DATE = 6;
export const DOC_SUBMIT_TO_CUSTOMER = 44;
export const PROCEED_DATE = 20;
export const FACTORY_PAYMENT = 11;
export const ETD_DATE_COMMERCIAL = 8;
export const HANDOVER_TO_FORWARDER = 7;
export const DOC_SUBMIT_TO_BANK = 18;

// level ids
export const ADMIN_LEVEL_ID = 5;

// Department Ids
export const MERCHANDISING_DEPARTMENT_ID = 1;
export const COMMERCIAL_DEPARTMENT_ID = 2;
export const ACCOUNTING_DEPARTMENT_ID = 3;
export const QUALITY_DEPARTMENT_ID = 4;
export const ADMIN_DEPARTMENT_ID = 5;
export const COMPLIANCE_DEPARTMENT_ID = 6;

// export const DEV = '20a3ff7b-1abe-4010-9d44-0428a28ce450';
// export const DEVELOPER_ID = 86;
// export const ERROR_LOGS = 87;

// urls
export const baseUrl = process.env.NODE_ENV === 'production' ? "http://200.234.33.89:6000" : "http://localhost:4000";