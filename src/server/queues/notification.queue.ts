import { Queue } from "bullmq";
import { ioredis } from "../ioredis";

export const notificationQueue = new Queue("notification", {
    connection: ioredis,
});