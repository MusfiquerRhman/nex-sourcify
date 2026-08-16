import type { inferRouterOutputs } from '@trpc/server';
import type { 
    lcTransferRouter, factoryInvoiceRouter, rdlInvoiceRouter, documentSubmissionRouter,
    commercialTnaTemplatesRouter, commercialTnaPlanRouter
} from "~/server/api";

// LC Transfer types
type LcTransferRouterOutput = inferRouterOutputs<typeof lcTransferRouter>;

export type GetLCTransferByIdTypes = LcTransferRouterOutput['getLcTransferById'];

// Factory Invoice types
type FactoryInvoiceRouterOutput = inferRouterOutputs<typeof factoryInvoiceRouter>;

export type GetShipmentDetailsForTagShipmentsTypes = FactoryInvoiceRouterOutput['getShipmentDetailsForTagShipments'];

export type GetFactoryInvoiceByIdTypes = FactoryInvoiceRouterOutput['getFactoryInvoiceById'];

// RDL Invoice types
type RdlInvoiceRouterOutput = inferRouterOutputs<typeof rdlInvoiceRouter>;

export type GetRdlInvoiceByIdTypes = RdlInvoiceRouterOutput['getRdlInvoiceById'];

// Document Submission types
type DocumentSubmissionRouterOutput = inferRouterOutputs<typeof documentSubmissionRouter>;

export type GetDocumentSubmissionByIdTypes = DocumentSubmissionRouterOutput['getDocumentSubmissionById'];


// TNA Template types
type TnaTemplateRouterOutput = inferRouterOutputs<typeof commercialTnaTemplatesRouter>;

export type GetTNATemplateByIdTypes = TnaTemplateRouterOutput['getTnaTemplateById'];

// TNA Planning Types
type TnaPlanningRouterOutput = inferRouterOutputs<typeof commercialTnaPlanRouter>;

export type GetTNAPlanByIdTypes = TnaPlanningRouterOutput['getTnaPlanById'];