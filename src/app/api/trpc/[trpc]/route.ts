import { randomUUID } from "crypto";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const createContext = async (req: NextRequest) => {
    const requestId = randomUUID();

    return createTRPCContext({
        headers: req.headers,

        request: {
            id: requestId,
            method: req.method,
            path: req.nextUrl.pathname,
            url: req.nextUrl.href,
            query: Object.fromEntries(req.nextUrl.searchParams),
            ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
            userAgent: req.headers.get("user-agent"),
            referer: req.headers.get("referer"),
            origin: req.headers.get("origin"),
            startTime: performance.now(),
        },
    });
};

const handler = (req: NextRequest) =>
    fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => createContext(req),
        onError: env.NODE_ENV === "development"
            ? ({ path, error }) => {
                console.error( `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
            }
            : undefined,
    });

export { handler as GET, handler as POST };