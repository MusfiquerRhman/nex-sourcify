import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const termsRouter = createTRPCRouter({
    getAllTerms: protectedProcedure
        .query(async ({ ctx }) => {
            const terms = await ctx.db.terms.findMany({
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                },
            });

            return terms;
        }),

    getTermsByBuyer: protectedProcedure
        .input(z.object({ buyerID: z.number() }))
        .query(async ({ ctx, input }) => {
            const terms = await ctx.db.$queryRaw<{ name: string; id: number }[]>`
                select distinct t.name, t.id from buyer_payment_term as bpt
                    inner join payment_terms as pt on bpt.payment_term_id = pt.id
                    inner join terms as t on t.id = pt.term_id
                    inner join buyers as b on b.id = bpt.buyer_id
                where b.id = ${input.buyerID}
            ;`;

            return terms;
        }),
});