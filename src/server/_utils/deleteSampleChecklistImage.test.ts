import type { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { sampleChecklistSections, type SampleChecklistImageSection } from "../../utils/sampleChecklist";
import { deleteSampleChecklistImage } from "./deleteSampleChecklistImage";

type ImageRelation = (typeof sampleChecklistSections)[number]["relation"];
type FixtureOptions = { visible?: boolean; failure?: "update" | "commit" };

const checklistId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const checklistAccess = { buyer_id: 7 };

const createFixture = async (context: TestContext, sectionName: SampleChecklistImageSection = "fabric", options: FixtureOptions = {}) => {
    const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "nexus-checklist-photo-delete-"));
    context.mock.method(process, "cwd", () => workingDirectory);
    context.after(async () => {
        context.mock.restoreAll();
        assert.equal(path.dirname(workingDirectory), path.resolve(os.tmpdir()));
        assert.match(path.basename(workingDirectory), /^nexus-checklist-photo-delete-/);
        await fs.rm(workingDirectory, { recursive: true, force: true });
    });

    const rows: Record<string, { id: string; url: string }[]> = {};
    const files: { id: string; section: SampleChecklistImageSection; filePath: string; content: string }[] = [];
    for (const [index, section] of sampleChecklistSections.entries()) {
        const id = `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
        const filePath = path.join(workingDirectory, "public", "sample_checklist", section.name, `${id}.jpg`);
        const content = `photo-${section.name}`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
        files.push({ id, section: section.name, filePath, content });
        rows[section.relation] = [{ id, url: `/uploads/sample_checklist/${section.name}/${id}.jpg` }];
    }

    const target = files.find((file) => file.section === sectionName)!;
    const siblingId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
    const siblingPath = path.join(path.dirname(target.filePath), `${siblingId}.jpg`);
    await fs.writeFile(siblingPath, "another photo in this section");
    const relation = sampleChecklistSections.find((section) => section.name === sectionName)!.relation;
    rows[relation]!.push({ id: siblingId, url: siblingPath });
    const events: string[] = [];
    const tx = {
        $queryRaw: async (_query: TemplateStringsArray, id: string) => {
            events.push("lock");
            return id === checklistId ? [{ id }] : [];
        },
        sample_check_list: {
            findFirst: async (args: { where: { id: string; buyer_id: number } & Partial<Record<ImageRelation, { some: { id: string } }>> }) => {
                events.push("access");
                assert.equal(args.where.buyer_id, checklistAccess.buyer_id);
                if (options.visible === false || args.where.id !== checklistId) return null;
                for (const section of sampleChecklistSections) {
                    const imageId = args.where[section.relation]?.some.id;
                    if (imageId && !rows[section.relation]!.some((image) => image.id === imageId)) return null;
                }
                return { id: checklistId };
            },
            update: async (args: { where: { id: string }; data: Partial<Record<ImageRelation, { delete: { id: string } }>> }) => {
                events.push("delete-row");
                assert.equal(args.where.id, checklistId);
                assert.equal(Object.keys(args.data).length, 1);
                if (options.failure === "update") throw new Error("Database update failed");
                for (const section of sampleChecklistSections) {
                    const deletedId = args.data[section.relation]?.delete.id;
                    if (deletedId) rows[section.relation] = rows[section.relation]!.filter((image) => image.id !== deletedId);
                }
                return { id: checklistId };
            },
        },
    };
    const db = {
        $transaction: async (callback: (transaction: typeof tx) => Promise<string>) => {
            const originalRows = structuredClone(rows);
            try {
                const result = await callback(tx);
                if (options.failure === "commit") throw new Error("Database commit failed");
                events.push("commit");
                return result;
            } catch (error) {
                Object.assign(rows, originalRows);
                throw error;
            }
        },
    } as unknown as PrismaClient;

    const remove = (overrides: Partial<{ checklistId: string; section: SampleChecklistImageSection; imageId: string }> = {}) => {
        return deleteSampleChecklistImage(db, { checklistId, section: sectionName, imageId: target.id, checklistAccess, ...overrides });
    };
    const assertFilesIntact = async () => {
        for (const file of files) assert.equal(await fs.readFile(file.filePath, "utf8"), file.content);
        assert.equal(await fs.readFile(siblingPath, "utf8"), "another photo in this section");
    };

    return { target, siblingPath, rows, relation, events, files, remove, assertFilesIntact };
};

for (const section of sampleChecklistSections) {
    void test(`deleting a ${section.name} photo removes only its file and database row`, async (context) => {
        const fixture = await createFixture(context, section.name);
        assert.equal(await fixture.remove(), fixture.target.id);
        await assert.rejects(fs.access(fixture.target.filePath));
        assert.equal(fixture.rows[fixture.relation]!.length, 1);
        assert.ok(!fixture.rows[fixture.relation]!.some((image) => image.id === fixture.target.id));
        for (const file of fixture.files.filter((file) => file.id !== fixture.target.id)) {
            assert.equal(await fs.readFile(file.filePath, "utf8"), file.content);
        }
        assert.equal(await fs.readFile(fixture.siblingPath, "utf8"), "another photo in this section");
        assert.deepEqual(fixture.events, ["lock", "access", "delete-row", "commit"]);
    });
}

void test("a missing photo file can still have its database row deleted", async (context) => {
    const fixture = await createFixture(context);
    await fs.unlink(fixture.target.filePath);
    await fixture.remove();
    assert.equal(fixture.rows[fixture.relation]!.length, 1);
});

void test("an inaccessible checklist cannot delete photo files or rows", async (context) => {
    const fixture = await createFixture(context, "fabric", { visible: false });
    await assert.rejects(fixture.remove(), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
    assert.deepEqual(fixture.events, ["lock", "access"]);
    assert.equal(fixture.rows[fixture.relation]!.length, 2);
    await fixture.assertFilesIntact();
});

void test("a different checklist, section or image ID cannot delete the requested photo", async (context) => {
    const fixture = await createFixture(context);
    for (const overrides of [
        { checklistId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb" },
        { section: "labels" as const },
        { imageId: "cccccccc-cccc-4ccc-cccc-cccccccccccc" },
    ]) {
        await assert.rejects(fixture.remove(overrides), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
    }
    assert.equal(fixture.rows[fixture.relation]!.length, 2);
    await fixture.assertFilesIntact();
});

void test("a file removal error rolls back the database deletion", async (context) => {
    const fixture = await createFixture(context);
    const originalUnlink = fs.unlink;
    context.mock.method(fs, "unlink", async (filename: Parameters<typeof fs.unlink>[0]) => {
        if (filename === fixture.target.filePath) throw Object.assign(new Error("File is locked"), { code: "EACCES" });
        return originalUnlink(filename);
    });
    await assert.rejects(fixture.remove(), /File is locked/);
    assert.equal(fixture.rows[fixture.relation]!.length, 2);
    await fixture.assertFilesIntact();
});

for (const failure of ["update", "commit"] as const) {
    void test(`a database ${failure} failure preserves the image row and photo file`, async (context) => {
        const fixture = await createFixture(context, "fabric", { failure });
        await assert.rejects(fixture.remove());
        assert.equal(fixture.rows[fixture.relation]!.length, 2);
        await fixture.assertFilesIntact();
    });
}

void test("stored URLs cannot redirect deletion to another photo", async (context) => {
    const fixture = await createFixture(context);
    fixture.rows[fixture.relation]![0]!.url = fixture.siblingPath;
    await fixture.remove();
    assert.equal(await fs.readFile(fixture.siblingPath, "utf8"), "another photo in this section");
    await assert.rejects(fs.access(fixture.target.filePath));
});

void test("invalid image IDs are rejected before accessing files or the database", async (context) => {
    const fixture = await createFixture(context);
    await assert.rejects(fixture.remove({ imageId: "../../another-folder/photo" }));
    assert.deepEqual(fixture.events, []);
    await fixture.assertFilesIntact();
});
