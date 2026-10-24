import type { inferRouterOutputs } from '@trpc/server';
import type { orderChecklistRouter } from "~/server/api";

type OrderChecklistRouterOutput = inferRouterOutputs<typeof orderChecklistRouter>;

export type GetOrderChecklistByIdTypes = OrderChecklistRouterOutput['getOrderChecklistById'];
export type GetOrderChecklistPDFDataTypes = OrderChecklistRouterOutput['getPDFData'];
