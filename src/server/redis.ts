import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
    redis: ReturnType<typeof createClient> | undefined;
};

export const redis = globalForRedis.redis ?? createClient({
    url: process.env.REDIS_URL,
});

redis.on("error", (error) => {
    // Redis is an optional cache; connection failures must not prevent the app
    // from starting or serving requests from the database.
    console.warn("[Redis] Connection error:", error.message);
});

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}

export async function getRedis() {
    if (!redis.isOpen) {
        try {
            await redis.connect();
        } catch (error) {
            console.warn("[Redis] Unavailable; continuing without cache:", error);
            return null;
        }
    }

    return redis;
}
