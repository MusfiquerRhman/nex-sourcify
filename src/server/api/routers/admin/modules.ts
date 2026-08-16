// import { DEV, DEVELOPER_ID, ERROR_LOGS } from "~/utils/config";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const modulesRouter = createTRPCRouter({
    getNavItems: protectedProcedure.query(async ({ ctx }) => {
        const modulesWithParents = await ctx.db.$queryRaw<{id: number, name: string, parent_module_id: number | null}[]>`
            WITH RECURSIVE selected AS (
                SELECT 
                    m.id, m.name, m.parent_module_id
                FROM modules m
                INNER JOIN level_permission lp ON lp.module_id = m.id
                INNER JOIN levels l ON l.id = lp.level_id
                INNER JOIN users u ON u.level_id = l.id and u.department_id = lp.department_id
                WHERE u.id = ${ctx?.user?.id}::uuid AND lp.can_view = true

                UNION

                SELECT 
                    m.id, m.name, m.parent_module_id
                FROM modules m
                INNER JOIN selected s ON s.parent_module_id = m.id
            )
            SELECT * FROM selected
            UNION
            SELECT id, name, parent_module_id FROM modules WHERE id = 1 -- always add dashboard
            ORDER BY id;
        `;

        // if(ctx?.user?.id === DEV){
        //     modulesWithParents.push({
        //         id: DEVELOPER_ID,
        //         name: 'Developer',
        //         parent_module_id: null
        //     });

        //     modulesWithParents.push({
        //         id: ERROR_LOGS, 
        //         name: 'Error Logs', 
        //         parent_module_id: DEVELOPER_ID
        //     })
        // }

        return Array.isArray(modulesWithParents) ? modulesWithParents : [];
    }),

    getModules: protectedProcedure.query(async ({ ctx }) => {
        const modules = await ctx.db.modules.findMany();
        return modules;
    }),  
});