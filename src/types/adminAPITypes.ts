import type { inferRouterOutputs } from '@trpc/server';
import type { teamsRouter, userRouter, evPermissionRouter } from "~/server/api";

// Teams types
type TeamsRouterOutput = inferRouterOutputs<typeof teamsRouter>;

export type GetTeamByIdTypes = TeamsRouterOutput['getTeamById'];

// Users types
type UserRouterOutput = inferRouterOutputs<typeof userRouter>;

export type GetUserTypes = UserRouterOutput['getUser'];


// EV Permissions types
type EvPermissionsRouterOutput = inferRouterOutputs<typeof evPermissionRouter>;

export type GetEvPermissionByIdTypes = EvPermissionsRouterOutput['getEvPermissionById'];