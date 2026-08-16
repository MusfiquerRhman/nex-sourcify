import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const levelRouter = createTRPCRouter({
    getLevels: protectedProcedure.query(async ({ ctx }) => {
        const levels = await ctx.db.levels.findMany();
        return levels;
    }),
});
