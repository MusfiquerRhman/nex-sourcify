import type { inferRouterOutputs } from '@trpc/server';
import type { 
    buyerOrdersRouter, factoryOrderRouter, tnaPlanRouter, tnaTemplatesRouter, commissionDistributionRouter,
    salesContractsRouter, salesContractAmendmentRouter, exFactoryRouter, lcMasterRouter, lcAmendmentRouter
} from "~/server/api";

// Buyer Orders types
type BuyerOrdersRouterOutput = inferRouterOutputs<typeof buyerOrdersRouter>;

export type GetBuyerOrderByIdTypes = BuyerOrdersRouterOutput['getBuyerOrderById'];

// Factory Order types
type FactoryOrdersRouterOutput = inferRouterOutputs<typeof factoryOrderRouter>;

export type GetFactoryOrderByIdTypes = FactoryOrdersRouterOutput['getFactoryOrderById'];

export type GetBuyerOrderDetailsByFactoryOrderIdTypes = FactoryOrdersRouterOutput['getBuyerOrderDetailsByFactoryOrderId'];

// TNA Plan types
type TNAPlanRouterOutput = inferRouterOutputs<typeof tnaPlanRouter>;

export type GetTNAPlanByIdTypes = TNAPlanRouterOutput['getTnaPlanById'];

// TNA Template types
type TNATemplatesRouterOutput = inferRouterOutputs<typeof tnaTemplatesRouter>;

export type GetTNATemplateByIdTypes = TNATemplatesRouterOutput['getTnaTemplateById'];

// Commission Distribution types
type CommissionDistributionRouterOutput = inferRouterOutputs<typeof commissionDistributionRouter>;

export type GetCommissionDistributionByIdTypes = CommissionDistributionRouterOutput['getCommissionDistributionById'];

// Sales Contract types
type SalesContractsRouterOutput = inferRouterOutputs<typeof salesContractsRouter>;

export type GetSalesContractByIdTypes = SalesContractsRouterOutput['getSalesContractById'];

// Sales Contract Amendment types
type SalesContractAmendmentRouterOutput = inferRouterOutputs<typeof salesContractAmendmentRouter>;

export type GetSalesContractAmendmentByIdTypes = SalesContractAmendmentRouterOutput['getSalesContractAmendmentById'];

// LC Master types
type LcMasterRouterOutput = inferRouterOutputs<typeof lcMasterRouter>;

export type GetLCbyIdTypes = LcMasterRouterOutput['getLCbyId'];

// LC Amendment types
type LCAmendmentRouterOutput = inferRouterOutputs<typeof lcAmendmentRouter>;

export type GetLCAmendmentByIdTypes = LCAmendmentRouterOutput['getLcAmendmentById'];

// Ex-Factory types
type ExFactoryRouterOutput = inferRouterOutputs<typeof exFactoryRouter>;

export type GetExFactoryByIdTypes = ExFactoryRouterOutput['getExFactoryById'];