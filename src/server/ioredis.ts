import IORedis from "ioredis";

export const ioredis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});