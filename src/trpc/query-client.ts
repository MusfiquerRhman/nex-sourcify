import { defaultShouldDehydrateQuery, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";

export const createQueryClient = () => {
	const handleError = (error: unknown) => { 
		if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") { 
			window.location.replace("/unauthorized"); 
		} 
	}

	return new QueryClient({
		queryCache: new QueryCache({
			onError: handleError,
		}),

		mutationCache: new MutationCache({
			onError: handleError,
		}),
		
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

				retry: (failureCount, error) => {
					if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") {
						return false;
					}

					return failureCount < 5;
				},
			},
			mutations: {
				retry: false,
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	});
}