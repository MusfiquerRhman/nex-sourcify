import type { inferRouterOutputs } from '@trpc/server';
import type { 
    fabricsSuppliersRouter, countriesRouter, currenciesRouter, overseasOfficesRouter, scContactPersonRouter,
    destinationsRouter, banksRouter, companiesRouter, paymentTermsRouter, productTypeRouter,
    fabricsRouter, colorsRouter, fobTypesRouter, freightTermsRouter, courierRouter, tnaActionsRouter,
    buyerRouter ,seasonsRouter, handoverDatesRouter,tnaBaseActionRouter, factoryRouter, productsRouter,
    toleranceLevelRouter, commissionPercentageRouter, earlySettlementPercentageRoute
} from "~/server/api";

// Bank types
type BankRouterOutput = inferRouterOutputs<typeof banksRouter>;

export type GetBankByIdTypes = BankRouterOutput['getBankById'];

// Buyer types
type BuyerRouterOutput = inferRouterOutputs<typeof buyerRouter>;

export type GetBuyerByIdTypes = BuyerRouterOutput['getBuyerById'];

// Colors types
type ColorsRouterOutput = inferRouterOutputs<typeof colorsRouter>;

export type GetColorByIdTypes = ColorsRouterOutput['getColorById'];

// Companies types
type CompaniesRouterOutput = inferRouterOutputs<typeof companiesRouter>;

export type GetCompanyByIdTypes = CompaniesRouterOutput['getCompanyById'];

// Countries types
type CountriesRouterOutput = inferRouterOutputs<typeof countriesRouter>;

export type GetCountryByIdTypes = CountriesRouterOutput['getCountryById'];

// Currencies types
type CurrenciesRouterOutput = inferRouterOutputs<typeof currenciesRouter>;

export type GetCurrencyByIdTypes = CurrenciesRouterOutput['getCurrencyById'];

// Destinations types
type DestinationsRouterOutput = inferRouterOutputs<typeof destinationsRouter>;

export type GetDestinationByIdTypes = DestinationsRouterOutput['getDestinationById'];

// Fabrics types
type FabricsRouterOutput = inferRouterOutputs<typeof fabricsRouter>;

export type GetFabricByIdTypes = FabricsRouterOutput['getFabricById'];

// Fabrics Suppliers types
type FabricsSuppliersRouterOutput = inferRouterOutputs<typeof fabricsSuppliersRouter>;

export type GetFabricSupplierByIdTypes = FabricsSuppliersRouterOutput['getFabricSupplierById'];

// FOB Types
type FobTypesRouterOutput = inferRouterOutputs<typeof fobTypesRouter>;

export type GetFobTypeByIdTypes = FobTypesRouterOutput['getFobTypeById'];

// Freight Terms types
type FreightTermsRouterOutput = inferRouterOutputs<typeof freightTermsRouter>;

export type GetFreightTermByIdTypes = FreightTermsRouterOutput['getFreightTermById'];

// Overseas Offices types
type OverseasOfficesRouterOutput = inferRouterOutputs<typeof overseasOfficesRouter>;

export type GetOverseasOfficeByIdTypes = OverseasOfficesRouterOutput['getOverseasOfficeById'];

// Payment Terms types
type PaymentTermsRouterOutput = inferRouterOutputs<typeof paymentTermsRouter>;

export type GetPaymentTermByIdTypes = PaymentTermsRouterOutput['getPaymentTermById'];

// Product Type types
type ProductTypeRouterOutput = inferRouterOutputs<typeof productTypeRouter>;

export type GetProductTypeByIdTypes = ProductTypeRouterOutput['getProductTypeById'];

// Seasons types
type SeasonsRouterOutput = inferRouterOutputs<typeof seasonsRouter>;

export type GetSeasonByIdTypes = SeasonsRouterOutput['getSeasonById'];

// TNA Actions types
type TnaActionsRouterOutput = inferRouterOutputs<typeof tnaActionsRouter>;

export type GetTnaActionByIdTypes = TnaActionsRouterOutput['getTnaActionById'];

// TNA Base Action types
type TnaBaseActionRouterOutput = inferRouterOutputs<typeof tnaBaseActionRouter>;

export type GetTnaBaseActionByIdTypes = TnaBaseActionRouterOutput['getTnaBaseActionById'];

// Handover Dates types
type HandoverDatesRouterOutput = inferRouterOutputs<typeof handoverDatesRouter>;

export type GetHandoverDateByIdTypes = HandoverDatesRouterOutput['getHandoverDateById'];

// Factory types
type FactoryRouterOutput = inferRouterOutputs<typeof factoryRouter>;

export type GetFactoryByIdTypes = FactoryRouterOutput['getFactoryById'];

// Products types
type ProductsRouterOutput = inferRouterOutputs<typeof productsRouter>;

export type GetProductByIdTypes = ProductsRouterOutput['getProductById'];

// Courier types
type CourierRouterOutput = inferRouterOutputs<typeof courierRouter>;

export type GetCourierByIdTypes = CourierRouterOutput['getCourierById'];


// SC Contact Person types
type ScContactPersonRouterOutput = inferRouterOutputs<typeof scContactPersonRouter>;

export type GetScContactPersonByIdTypes = ScContactPersonRouterOutput['getContactPersonById'];

// Tolerance Level types
type ToleranceLevelRouterOutput = inferRouterOutputs<typeof toleranceLevelRouter>;

export type GetToleranceLevelByIdTypes = ToleranceLevelRouterOutput['getToleranceByID'];

// Commission Percentage type
type CommissionPercentageRouterOutput = inferRouterOutputs<typeof commissionPercentageRouter>;

export type GetCommissionPercentageByIdTypes = CommissionPercentageRouterOutput['getCommissionById'];

// Early Settlement type
type EarlySettlementPercentageRouterOutput = inferRouterOutputs<typeof earlySettlementPercentageRoute>;

export type GetEarlySettlementPercentageByIdTypes = EarlySettlementPercentageRouterOutput['getEarlySettlementPercentageById'];