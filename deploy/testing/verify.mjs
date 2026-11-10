import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { Client } from "pg";
import { Queue } from "bullmq";
import Redis from "ioredis";

assert.equal(process.env.APP_ENV, "testing");
const databaseUrl = new URL(process.env.DATABASE_URL);
assert.equal(databaseUrl.hostname, "postgres");
assert.equal(databaseUrl.pathname, "/sourcify_testing");
const baseUrl = "http://app:8000";
let token;
let countryId;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const redis = new Redis("redis://redis:6379", { maxRetriesPerRequest: null });
const history = new Queue("history", { connection: redis });
await client.connect();

async function call(method, path, input) {
    const url = new URL(`/api/trpc/${path}`, baseUrl);
    if (method === "GET" && input !== undefined) url.searchParams.set("input", JSON.stringify({ json: input }));
    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(method === "POST" ? { body: JSON.stringify({ json: input }) } : {}),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(`${path}: ${result.error?.json?.message ?? response.status}`);
    return result.result.data.json;
}

try {
    const response = await fetch(`${baseUrl}/signin`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes("TESTING SERVER"));
    console.log("PASS: sign-in screen responds and identifies the testing server.");
    const csp = response.headers.get("content-security-policy");
    const nonce = csp?.match(/'nonce-([^']+)'/)?.[1];
    const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(([tag]) => tag);
    if (nonce) assert.ok(scripts.every(tag => tag.includes(`nonce="${nonce}"`)), "Page scripts must match its CSP nonce.");

    const login = await call("POST", "auth.login", {
        user_id: process.env.TEST_ADMIN_USER ?? "trainingadmin",
        password: process.env.TEST_ADMIN_PASSWORD,
        device_id: "testing-deployment-verification",
    });
    token = login.token;
    assert.ok(token);
    const modules = await call("GET", "modules.getNavItems");
    assert.ok(modules.length >= 80);
    const countries = await call("GET", "countries.getCountries", { limit: 15, offset: 0 });
    assert.equal(countries.totalCount, 0);
    console.log(`PASS: training administrator login, ${modules.length} navigation modules, permissions and fresh business tables.`);

    assert.ok((await history.getWorkers()).length > 0);
    const country = await call("POST", "countries.addCountry", { name: `Deployment verification ${randomUUID()}`, country_code: "TEST" });
    countryId = country.id;
    let processed = false;
    for (let attempt = 0; attempt < 40; attempt++) {
        const result = await client.query("SELECT COUNT(*)::int AS count FROM countries_history WHERE country_id = $1", [countryId]);
        if (result.rows[0].count > 0) { processed = true; break; }
        await setTimeout(500);
    }
    assert.ok(processed, "Automation must write the history queued by the Next.js app.");
    console.log("PASS: Next.js write -> isolated Redis queue -> automation worker -> testing database history.");
} finally {
    if (countryId !== undefined) {
        const jobs = await history.getJobs(["completed", "failed"], 0, 100);
        for (const job of jobs) if (job.data.country_id === countryId) await job.remove();
        await client.query("DELETE FROM countries_history WHERE country_id = $1", [countryId]);
        await client.query("DELETE FROM countries WHERE id = $1", [countryId]);
    }
    if (token) await client.query("DELETE FROM user_sessions WHERE session_token = $1", [token]);
    await history.close();
    await redis.quit();
    await client.end();
    console.log("Deployment verification records cleaned up.");
}
