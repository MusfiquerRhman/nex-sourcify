import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import z from "zod";
import { m } from "~/utils/moduleMap";

interface UserSessions {
    full_name: string;
    user_id: string;
    ip: string;
    browser: string;
    login_time: Date;
    expire_date: Date;
    logout_at: Date | null;
    device_id: string | null;
    total_count: bigint;
}

export const userSessionsRouter = createTRPCRouter({
    getSessions: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            }))    
        .query(async ({ctx, input}) => {
            const can_view = ctx.permissions[m.ERROR_LOGS]?.can_view;
            // const can_view = ctx?.user?.id === DEV;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view error logs." 
                });
            }

            const result = await ctx.db.$queryRaw<UserSessions[]>`
                WITH SESSIONS AS (
                    SELECT
                        CONCAT(U.first_name, ' ', U.last_name) AS FULL_NAME,
                        U.user_id,
                        US.IP,
                        US.BROWSER,
                        US.LOGIN_TIME,
                        US.EXPIRE_DATE,
                        US.LOGOUT_AT,
                        US.DEVICE_ID
                    FROM user_sessions AS US
                        INNER JOIN USERS AS U ON U.id = US.user_id
                    ORDER BY US.LOGIN_TIME DESC
                )
                SELECT 
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM SESSIONS
                LIMIT ${input.limit ?? 10}
                OFFSET ${input.offset ?? 0};
            `;

            const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
            const sessions = result.map(({ total_count: _, ...row }) => row);

            return { sessions, total: total };
        }),
    
    searchSessions: protectedProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(0).default(15),
                offset: z.number().min(0).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const can_view = ctx.permissions[m.ERROR_LOGS]?.can_view;
            // const can_view = ctx?.user?.id === DEV;

            if(!can_view) {
                throw new TRPCError({ 
                    code: "FORBIDDEN", 
                    message: "You do not have permission to view error logs." 
                });
            }

            const result = await ctx.db.$queryRaw<UserSessions[]>`
                WITH SESSIONS AS (
                    SELECT
                        CONCAT(U.first_name, ' ', U.last_name) AS FULL_NAME,
                        U.user_id,
                        US.IP,
                        US.BROWSER,
                        US.LOGIN_TIME,
                        US.EXPIRE_DATE,
                        US.LOGOUT_AT,
                        US.DEVICE_ID
                    FROM user_sessions AS US
                        INNER JOIN USERS AS U ON U.id = US.user_id
                    WHERE 
                        CONCAT(U.first_name, ' ', U.last_name) ILIKE '%' || ${input.query} || '%'
                        OR U.user_id ILIKE '%' || ${input.query} || '%'
                        OR US.IP::TEXT ILIKE '%' || ${input.query} || '%'
                        OR US.BROWSER ILIKE '%' || ${input.query} || '%'
                        OR US.DEVICE_ID::TEXT ILIKE '%' || ${input.query} || '%'
                    ORDER BY US.LOGIN_TIME DESC
                )
                SELECT 
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM SESSIONS
                LIMIT ${input.limit ?? 10}
                OFFSET ${input.offset ?? 0};
            `;

            const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
            const sessions = result.map(({ total_count: _, ...row }) => row);

            return { sessions, total: total };
        }),
})