import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const healthRouter = createTRPCRouter({
    heartBeat: publicProcedure.query(() => {
        return {
            ok: true,
            timestamp: Date.now(),
        };
    }),
});