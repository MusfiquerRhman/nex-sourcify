import { Queue } from "bullmq";
import { ioredis } from "../ioredis";

export const historyQueue = new Queue("history", {
    connection: ioredis,
});