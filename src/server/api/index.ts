// Admin routers
export { levelRouter } from "./routers/admin/levels";
export { modulesRouter } from "./routers/admin/modules";
export { authRouter } from "./routers/admin/auth";
export { userRouter } from "./routers/admin/users";
export { teamsRouter } from "./routers/admin/teams";
export { authorizationsRouter } from "./routers/admin/authorizations";
export { permissionRouter } from "./routers/admin/permissions";
export { evPermissionRouter } from "./routers/admin/evPermissions";

// Library routers
export { departmentsRouter } from "./routers/library/departments";
export { countriesRouter } from "./routers/library/countries";
export { currenciesRouter } from "./routers/library/currencies";
export { overseasOfficesRouter } from "./routers/library/overseasOffices";
export { destinationsRouter } from "./routers/library/destinations";
export { banksRouter } from "./routers/library/banks";
export { companiesRouter } from "./routers/library/companies";
export { termsRouter } from "./routers/library/terms";
export { paymentTermsRouter } from "./routers/library/paymentTerms";
export { productTypeRouter } from "./routers/library/productType";
export { productsRouter } from "./routers/library/products";
export { fabricsRouter } from "./routers/library/fabrics";
export { fabricsSuppliersRouter } from "./routers/library/fabricsSuppliers";
export { colorsRouter } from "./routers/library/colors";
export { fobTypesRouter } from "./routers/library/fobTypes";
export { freightTermsRouter } from "./routers/library/freightTerms";
export { courierRouter } from "./routers/library/courier";
export { tnaActionsRouter } from "./routers/library/tnaActions";
export { factoryRouter } from "./routers/library/factory";
export { buyerRouter } from "./routers/library/buyer";
export { seasonsRouter } from "./routers/library/seasons";

// System routers
export { handoverDatesRouter } from "./routers/system/handoverDates";
export { tnaBaseActionRouter } from "./routers/system/tnaBaseAction";
export { toleranceLevelRouter } from "./routers/system/toleranceLevel";
export { commissionPercentageRouter } from "./routers/system/commissionPercentage";
export { earlySettlementPercentageRoute } from "./routers/system/earlySettlementPercentage";
export { scContactPersonRouter } from "./routers/system/scContactPerson";

// Merchandising routers
export { buyerOrdersRouter } from "./routers/merchandising/buyerOrders";
export { factoryOrderRouter } from "./routers/merchandising/factoryOrder";
export { tnaTemplatesRouter } from "./routers/merchandising/tnaTemplates";
export { tnaPlanRouter } from "./routers/merchandising/tnaPlan";
export { commissionDistributionRouter } from "./routers/merchandising/commissionDistribution";
export { salesContractsRouter } from "./routers/merchandising/salesContracts";
export { salesContractAmendmentRouter } from "./routers/merchandising/salesContractAmendment"
export { lcMasterRouter } from "./routers/merchandising/lcMaster";
export { lcAmendmentRouter } from "./routers/merchandising/lcAmendment";
export { exFactoryRouter } from "./routers/merchandising/exfactory";
export { earlySettlementRouter } from "./routers/merchandising/earlySettlement"

// Commercial routers
export { lcTransferRouter } from "./routers/commercial/lcTransfer";
export { factoryInvoiceRouter } from "./routers/commercial/factoryInvoice";
export { rdlInvoiceRouter } from "./routers/commercial/rdlInvoice";
export { documentSubmissionRouter } from "./routers/commercial/documentSubmission";
export { commercialTnaTemplatesRouter } from "./routers/commercial/tnaTemplates";
export { commercialTnaPlanRouter } from "./routers/commercial/tnaPlanning";

// Accounting routers
export { commissionInvoiceRouter } from "./routers/accounting/commissionInvoice";
export { proceedRealizationRouter } from "./routers/accounting/proceedRealization";
export { factoryPaymentRouter } from "./routers/accounting/factoryPayment";
export { debitNotesRouter } from "./routers/accounting/debitNotes";
export { crossPaymentsRouter } from "./routers/accounting/crossPayment";

// Reports routers
export { salesReportRouter } from "./routers/reports/salesReport";
export { exportReportRouter } from "./routers/reports/exportReport";
export { orderSummaryReportRouter } from "./routers/reports/orderSummaryReport";
export { activityReportRouter } from "./routers/reports/commercialActivityReport";
export { exportSummaryReportRouter } from "./routers/reports/exportSummaryReport";
export { lcScClosingRouter } from "./routers/reports/lcScClosing"

// Maintenance router
export { errorLogsRouter } from "./routers/maintenance/error_logs";
export { userSessionsRouter } from "./routers/maintenance/user_sessions";