import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { UAParser } from "ua-parser-js";

// Type guard
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return typeof error === "object" && error !== null && "code" in error;
}

function parseUserAgent(ua: any): string {
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const browserName = result.browser.name ?? "Unknown";
    const browserVer = result.browser.version ?? "Unknown";
    const osName = result.os.name ?? "Unknown";
    const osVer = result.os.version ?? "Unknown";

    return `${browserName} ${browserVer} on ${osName} ${osVer}`;
}

// Log errors only. Never throw from here.
export async function logError(error: unknown, ctx: any, input?: unknown): Promise<void> {
    try {
        await ctx.db.error_logs.create({
            data: {
                request_id: ctx.request.id,
                procedure_name: ctx.request.path,
                request_method: ctx.request.method,
                query_params: ctx.request.query,
                ip_address: ctx.request.ip,
                user_agent: parseUserAgent(ctx.request.userAgent),
                referer: ctx.request.referer,
                input_data: input,
                error_name: error instanceof Error ? error.name : "UnknownError",
                error_code: typeof error === "object" && error !== null && "code" in error
                    ? String((error as { code: unknown }).code)
                    : typeof error === "string" ? error : "UnknownCode",
                error_message: error instanceof Error ? error.message : String(error),
                user_id: ctx.user.id,
            },
        });
    }
    catch (logError) {
        // Never let logging failures hide the real error.
        console.error("Failed to save error log:", logError);
    }
}

// Convert any error into a TRPCError.
// This function NEVER returns.
export function handlePrismaError(error: unknown): never {
    if (error instanceof TRPCError) {
        throw error;
    }

    if (isPrismaError(error)) {
        switch (error.code) {
            case "P2000":
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "One of the values is too long for the database column.",
                    cause: error,
                });

            case "P2002":
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Duplicate value found, this value already exists.",
                    cause: error,
                });

            case "P2003":
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This record is referenced by other records and cannot be deleted.",
                    cause: error,
                });

            case "P2025":
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "The requested record was not found.",
                    cause: error,
                });

            default:
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Database operation failed: ${error.message}`,
                    cause: error,
                });
        }
    }

    if (error instanceof Error) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
        });
    }

    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
    });
}