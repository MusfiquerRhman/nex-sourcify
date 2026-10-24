import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

import { db } from "~/server/db";
import { getRedis } from "~/server/redis";

interface TRPCContextOptions {
    headers: Headers;
    request?: {
        id: string;
        method: string;
        path: string;
        url: string;
        query: Record<string, string>;
        ip: string | null;
        userAgent: string | null;
        referer: string | null;
        origin: string | null;
	}
}

const JWT_SECRET = process.env.JWT_SECRET!;

// Extract the Bearer token from headers
const getBearerToken = (headers: Headers): string | null => {
	const authHeader = headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) return null;
	const parts = authHeader.split(" ");
	return parts[1] ?? null;
};

// Decode and verify JWT token
const verifyToken = (token: string) => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return typeof decoded === "object" && "user_id" in decoded ? decoded as { user_id: string } : null;
	} catch (err) {
		console.warn("[tRPC Context] Invalid token:", err);
		return null;
	}
};

// Fetch user from database
const getUserFromPayload = async (payload: { user_id: string } | null) => {
	if (!payload) return null;

	const cacheKey = `auth:user:${payload.user_id}`;
	const redis = await getRedis();
	const cached = redis ? await redis.get(cacheKey) : null;
	if (cached) {
		return superjson.parse(cached) as Awaited<ReturnType<typeof db.users.findUnique>>;
	}

	const user = await db.users.findUnique({
		where: { user_id: payload.user_id },
		select: {
			id: true,
			first_name: true,
			last_name: true,
			department_id: true,
			is_active: true,
			user_id: true,
			level_id: true,
		},
	});
	
	if (user) {
		if (redis) await redis.set(cacheKey, superjson.stringify(user), { EX: 600 });
	}

	return user;
};

export const invalidateAuthUserCache = async (...userIds: string[]) => {
	const redis = await getRedis();
	if (redis) await Promise.all(userIds.map((userId) => redis.del(`auth:user:${userId}`)));
};

export const invalidateAuthPermissionsCache = async () => {
    const redis = await getRedis();
    if (!redis) return;

    for await (const keys of redis.scanIterator({ MATCH: "auth:permissions:*" })) {
        if (keys.length > 0) await redis.del(keys);
    }
};

// Main context creator
export const createTRPCContext = async (opts: TRPCContextOptions) => {
	const token = getBearerToken(opts.headers);
	const payload = token ? verifyToken(token) : null;
	const user = await getUserFromPayload(payload);

	const cacheKey = `auth:permissions:${user?.level_id}:${user?.department_id}`;
	const redis = await getRedis();
	const cached = user && redis ? await redis.get(cacheKey) : null;
	const permissionsArray: Awaited<ReturnType<typeof db.level_permission.findMany>> = user
		? cached
			? JSON.parse(cached) as Awaited<ReturnType<typeof db.level_permission.findMany>>
			: await db.level_permission.findMany({
				where: {
					level_id: user.level_id ?? undefined,
					department_id: user.department_id ?? undefined,
				},
			})
		: [];

	if (user && redis && !cached) {
		await redis.set(cacheKey, JSON.stringify(permissionsArray), { EX: 600 });
	}

	// Convert permissions array to a map for fast access
	const permissions = permissionsArray.reduce((map, permission) => {
		map[permission.module_id] = permission;
		return map;
	}, {} as Record<number, typeof permissionsArray[number]>);

	return {
		db,
		user,
		permissions,
		...opts,
	};
};

// INITIALIZATION
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
				error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

// Create a server-side caller.
export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * it can help catch unwanted waterfalls by simulating network latency 
 * that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	// In development, add an artificial delay to simulate network latency
	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result;
});


// Public (unauthenticated) procedure
export const publicProcedure = t.procedure.use(timingMiddleware);

// Protected (authenticated) procedure
export const protectedProcedure = t.procedure
	.use(
		t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ 
				code: "UNAUTHORIZED", 
				message: "Invalid or expired token" 
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
				},
			});
		}),
	)
	.use(timingMiddleware);
