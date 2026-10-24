import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { historyQueue } from "~/server/queues/history.queue";
import type { HistoryLookupJob } from "~/server/queues/historyLookupJobs";

type HistoryWrite = { model: string; data: unknown };

export const transactionWithQueuedHistory = async <T>(
    db: PrismaClient,
    callback: (
        tx: Prisma.TransactionClient,
        queueHistoryJob: (job: HistoryLookupJob) => void,
    ) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
): Promise<T> => {
    const historyWrites: HistoryWrite[] = [];
    const historyJobs: HistoryLookupJob[] = [];
    const result = await db.$transaction(async (transaction) => {
        const tx = new Proxy(transaction, {
            get(target, property) {
                const delegate = Reflect.get(target, property, target);
                if (typeof property !== "string" || !property.endsWith("_history") || !delegate) {
                    return delegate;
                }

                return new Proxy(delegate, {
                    get(historyDelegate, method) {
                        if (method === "create" || method === "createMany") {
                            return async (args: { data: unknown | unknown[] }) => {
                                const entries = Array.isArray(args.data) ? args.data : [args.data];
                                historyWrites.push(...entries.map((data) => ({ model: property, data })));
                                return { count: entries.length };
                            };
                        }

                        const value = Reflect.get(historyDelegate, method, historyDelegate);
                        return typeof value === "function" ? value.bind(historyDelegate) : value;
                    },
                });
            },
        }) as Prisma.TransactionClient;

        return callback(tx, (job) => {
            job.data.action_at ??= new Date().toISOString();
            historyJobs.push(job);
        });
    }, options);

    if (historyWrites.length === 0 && historyJobs.length === 0) return result;

    const countsByModel = historyWrites.reduce<Record<string, number>>((counts, write) => {
        counts[write.model] = (counts[write.model] ?? 0) + 1;
        return counts;
    }, {});
    for (const job of historyJobs) {
        countsByModel[job.name] = (countsByModel[job.name] ?? 0) + 1;
    }
    console.info("[history-queue] Transaction committed; enqueueing history writes", {
        count: historyWrites.length + historyJobs.length,
        countsByModel,
    });

    const jobs = [
        ...historyWrites.map((write) => ({ name: write.model, data: write.data })),
        ...historyJobs,
    ].map((job) => ({
        ...job,
        opts: {
            attempts: 5,
            backoff: { type: "exponential" as const, delay: 1000 },
        },
    }));

    try {
        const addedJobs = await historyQueue.addBulk(jobs);

        console.info("[history-queue] Enqueued history writes", {
            count: addedJobs.length,
            countsByModel,
        });
    } catch (error) {
        console.error("[history-queue] Failed to enqueue history writes", {
            count: jobs.length,
            error,
        });
        throw error;
    }

    return result;
}
