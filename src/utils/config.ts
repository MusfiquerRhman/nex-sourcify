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
export const PP_MEETING_DATE = 26;

// level ids
export const ADMIN_LEVEL_ID = 5;

// Department Ids
export const MERCHANDISING_DEPARTMENT_ID = 1;
export const COMMERCIAL_DEPARTMENT_ID = 2;
export const ACCOUNTING_DEPARTMENT_ID = 3;
export const QUALITY_DEPARTMENT_ID = 4;
export const ADMIN_DEPARTMENT_ID = 5;
export const COMPLIANCE_DEPARTMENT_ID = 6;

// Term ID
export const TT_ID = 1;
export const LC_ID = 2;


// Defaults
export const SALES_CONTRACT_DEFAULT_CONTRACT_PERSON_ID = '1';
export const DEFAULT_FREIGHT_TERM = '1';

// urls
export const baseUrl = process.env.NODE_ENV === 'production' ? "http://rdlerp.rgbd.local:60005" : "http://localhost:4000";