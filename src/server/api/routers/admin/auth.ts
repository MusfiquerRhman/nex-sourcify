import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../../trpc";
import bcrypt from "bcryptjs";
import { signJwt } from "~/server/_utils/jwt";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { UAParser } from "ua-parser-js";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";

const getClientIp = (headers: Headers) => {
    const xff = headers.get("x-forwarded-for");
    if (!xff) return null;
    return xff.split(",")[0]?.trim() ?? null; // the real client IP
};

export function getBrowserInfo(headers: Headers): string {
    const ua = headers.get("user-agent") ?? undefined;
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const browserName = result.browser.name ?? "Unknown";
    const browserVer = result.browser.version ?? "Unknown";
    const osName = result.os.name ?? "Unknown";
    const osVer = result.os.version ?? "Unknown";

    return `${browserName} ${browserVer} on ${osName} ${osVer}`;
}

export const authRouter = createTRPCRouter({
  // User authentication
  	login: publicProcedure
		.input(z.object({
			user_id: z.string(),
			password: z.string(),
			device_id: z.string().optional(),
		}),
    ).mutation(async ({ ctx, input }) => {
		const user = await ctx.db.users.findUnique({
			select: {
				id: true,
				first_name: true,
				last_name: true,
				user_id: true,
				email: true,
				password: true,
				hashed_password: true,
				created_at: true,
				phone_no: true,
				is_active: true,
				departments: {
					select: {
						id: true,
						name: true
					}
				},
				levels: {
					select: {
						id: true,
						name: true
					}
				},
			},
			where: { 
				user_id: input.user_id,
				is_active: true
			},
		});

		// Validate user existence
		if (!user) throw new TRPCError({
			code: "NOT_FOUND",
			message: "User Not Found",
		});
		
		if(user.is_active === false) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User account is inactive",
			});
		}

		const isValid = await bcrypt.compare(input.password, user.hashed_password);
		if (!isValid) throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Invalid password",
		});

		// Generate JWT token
		const token = signJwt({ 
			id: user.id, 
			user_id: user.user_id, 
			first_name: user.first_name,
			last_name: user.last_name,
			department_id: user.departments.id,
			department_name: user.departments.name,
			level_id: user.levels?.id,
			level_name: user.levels?.name,
		});

		const loginTime = new Date();

		// Store session in DB
		await ctx.db.user_sessions.create({
			data: {
				user_id: user.id,
				session_token: token,
				ip: getClientIp(ctx.headers)?.replace(/^::ffff:/, ""),
				browser: getBrowserInfo(ctx.headers),
				device_id: input.device_id ?? "Unknown Device",
				login_time: loginTime,
        		expire_date: new Date(loginTime.getTime() + 18 * 60 * 60 * 1000),
			},
		});

		// Set HttpOnly cookie
		(await cookies()).set({
			name: "access-token",
			value: token,
			httpOnly: true,      
			path: "/",         
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax", 
			expires: new Date(Date.now() + 3600000 * 18) // 18 hours from now
		});

		return { token, user };
    }),

	// Logout user and clear session cookie
	logout: protectedProcedure
		.mutation(async ({ctx}) => {
		try {
			const cookiesStore = await cookies();

			const token = cookiesStore.get("access-token")?.value;

			if (token) {
				console.log("Logging out user with token:", new Date().toLocaleString());
				await ctx.db.user_sessions.updateMany({
					where: { session_token: token },
					data: { 
						logout_at: new Date(),
					},
				});
			}

			cookiesStore.delete("access-token"); 
			return { success: true };
		} catch (error) {
    		handlePrismaError(error);
		}
    }),
});