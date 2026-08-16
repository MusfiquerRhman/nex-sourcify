import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const departmentsRouter = createTRPCRouter({
  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    const departments = await ctx.db.departments.findMany();
    return departments;
  }),

});
