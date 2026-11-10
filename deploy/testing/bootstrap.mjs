import { readFile } from "node:fs/promises";
import { Client } from "pg";
import bcrypt from "bcryptjs";

const databaseUrl = new URL(process.env.DATABASE_URL);
if (process.env.APP_ENV !== "testing" || databaseUrl.hostname !== "postgres" || databaseUrl.pathname !== "/sourcify_testing") {
    throw new Error("Bootstrap is restricted to the isolated sourcify_testing database.");
}
if (!process.env.TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD.length < 16) {
    throw new Error("Set a training administrator password with at least 16 characters.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
const ensureLevels = async () => {
    for (let id = 1; id <= 5; id++) {
        await client.query(
            "INSERT INTO levels (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
            [id, `Level ${id}`],
        );
    }
    await client.query("SELECT setval(pg_get_serial_sequence('levels', 'id'), (SELECT MAX(id) FROM levels))");
};
await client.connect();
try {
    await client.query("BEGIN");
    const { rows: [state] } = await client.query("SELECT current_database() AS name, to_regclass('public.users') AS users");
    if (state.name !== "sourcify_testing") throw new Error("Unexpected database name.");
    if (state.users) {
        await ensureLevels();
        await client.query("INSERT INTO terms (id, name) VALUES (1, 'TT'), (2, 'LC') ON CONFLICT (id) DO NOTHING");
        await client.query("SELECT setval(pg_get_serial_sequence('terms', 'id'), (SELECT MAX(id) FROM terms))");
        console.log("Testing schema already exists; existing training data has been preserved.");
        await client.query("COMMIT");
    } else {
        await client.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));

        const moduleSource = await readFile(new URL("../../src/utils/moduleMap.ts", import.meta.url), "utf8");
        const urlSource = await readFile(new URL("../../src/utils/url.config.ts", import.meta.url), "utf8");
        const ids = new Map([...moduleSource.matchAll(/^\s*([A-Z_]+)\s*=\s*(\d+)/gm)].map(([, key, id]) => [key, Number(id)]));
        const paths = new Map([...urlSource.matchAll(/\[m\.([A-Z_]+)\]\s*:\s*\{\s*href:\s*"([^"]+)"/g)].map(([, key, path]) => [key, path]));
        for (const key of ["SYSTEM", "MAINTENANCE", "QUALITY", "COMPLIANCE"]) paths.set(key, `/${key.toLowerCase()}`);
        const modules = [...paths].map(([key, path]) => {
            const parent = [...paths].filter(([, candidate]) => path.startsWith(`${candidate}/`)).sort((a, b) => b[1].length - a[1].length)[0];
            const id = ids.get(key);
            if (!id) throw new Error(`Missing module ID: ${key}`);
            return { id, name: key.replaceAll("_", " "), parent: parent ? ids.get(parent[0]) : null, path };
        }).sort((a, b) => a.path.split("/").length - b.path.split("/").length);

        for (const module of modules) {
            await client.query("INSERT INTO modules (id, name, parent_module_id) VALUES ($1, $2, $3)", [module.id, module.name, module.parent]);
        }
        for (const [id, name] of [[1, "Merchandising"], [2, "Commercial"], [3, "Accounting"], [4, "Quality"], [5, "Admin"], [6, "Compliance"]]) {
            await client.query("INSERT INTO departments (id, name) VALUES ($1, $2)", [id, name]);
        }
        await ensureLevels();
        await client.query("INSERT INTO terms (id, name) VALUES (1, 'TT'), (2, 'LC')");
        const { rows: [admin] } = await client.query(
            `INSERT INTO users (first_name, last_name, phone_no, password, email, department_id, user_id, hashed_password, level_id)
             VALUES ('Training', 'Administrator', '', '', '', 5, $1, $2, 5) RETURNING id`,
            [process.env.TEST_ADMIN_USER ?? "trainingadmin", await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD, 12)],
        );
        await client.query(
            `INSERT INTO level_permission (level_id, module_id, department_id, can_view, can_add, can_update, can_delete, can_trace, added_by)
             SELECT 5, id, 5, true, true, true, true, true, $1 FROM modules`, [admin.id],
        );
        for (const table of ["modules", "departments", "levels", "terms"]) {
            await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}))`);
        }
        await client.query("COMMIT");
        console.log(`Fresh testing schema created with ${modules.length} modules and one training administrator. No production records were copied.`);
    }
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    await client.end();
}
