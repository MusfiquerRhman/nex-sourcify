import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// import { DEV } from "~/utils/config";
import type { Prisma } from "@prisma/client";
import z from "zod";
import { m } from "~/utils/moduleMap";

interface ErrorLogs {
    full_name: string;
    user_id: string;
    request_id: string;
    created_at: Date;
    procedure_name: string;
    request_method: string;
    ip_address: string | null;
    user_agent: string | null;
    referer: string | null;
    input_data: Prisma.JsonValue;
    error_name: string;
    error_code: string | null;
    total_count: bigint;
    error_message: string | null;
}

export const errorLogsRouter = createTRPCRouter({
    getErrors: protectedProcedure
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

            const result = await ctx.db.$queryRaw<ErrorLogs[]>`
                WITH ERRORS AS (
                    SELECT 
                        CONCAT(U.first_name, ' ', U.last_name, ' - ', U.user_id) AS FULL_NAME,
                        U.USER_ID,
                        EL.REQUEST_ID,
                        EL.CREATED_AT,
                        EL.PROCEDURE_NAME,
                        EL.REQUEST_METHOD,
                        EL.IP_ADDRESS,
                        EL.USER_AGENT,
                        EL.REFERER,
                        EL.INPUT_DATA,
                        EL.ERROR_NAME,
                        EL.ERROR_CODE,
                        EL.USER_ID,
                        EL.error_message
                    FROM ERROR_LOGS AS EL
                    INNER JOIN USERS AS U ON U.ID = EL.USER_ID
                    ORDER BY EL.CREATED_AT DESC
                )
                SELECT 
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM ERRORS
                LIMIT ${input.limit ?? 10}
                OFFSET ${input.offset ?? 0};
            `;

            const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
            const errors = result.map(({ total_count: _, ...row }) => row);

            return { errors, total: total };
        }),
    
    searchErrors: protectedProcedure
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

            const result = await ctx.db.$queryRaw<ErrorLogs[]>`
                WITH ERRORS AS (
                    SELECT
                        CONCAT(U.first_name, ' ', U.last_name, ' - ', U.user_id) AS FULL_NAME,
                        U.USER_ID,
                        EL.REQUEST_ID,
                        EL.CREATED_AT,
                        EL.PROCEDURE_NAME,
                        EL.REQUEST_METHOD,
                        EL.IP_ADDRESS,
                        EL.USER_AGENT,
                        EL.REFERER,
                        EL.INPUT_DATA,
                        EL.ERROR_NAME,
                        EL.ERROR_CODE,
                        EL.USER_ID,
                        EL.error_message
                    FROM ERROR_LOGS AS EL
                    INNER JOIN USERS AS U ON U.ID = EL.USER_ID
                    WHERE 
                        CONCAT(U.first_name, ' ', U.last_name, ' - ', U.user_id) ILIKE '%' || ${input.query} || '%'
                        OR EL.PROCEDURE_NAME ILIKE '%' || ${input.query} || '%'
                        OR EL.REQUEST_METHOD ILIKE '%' || ${input.query} || '%'
                        OR EL.IP_ADDRESS::TEXT ILIKE '%' || ${input.query} || '%'
                        OR EL.USER_AGENT ILIKE '%' || ${input.query} || '%'
                        OR EL.REFERER ILIKE '%' || ${input.query} || '%'
                        OR EL.ERROR_NAME ILIKE '%' || ${input.query} || '%'
                        OR EL.ERROR_CODE ILIKE '%' || ${input.query} || '%'
                        OR EL.error_message ILIKE '%' || ${input.query} || '%'
                    ORDER BY EL.CREATED_AT DESC
                )
                SELECT 
                    *,
                    COUNT(*) OVER() AS TOTAL_COUNT
                FROM ERRORS
                LIMIT ${input.limit ?? 10}
                OFFSET ${input.offset ?? 0};
            `;

            const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
            const errors = result.map(({ total_count: _, ...row }) => row);

            return { errors, total: total };
        }),
})