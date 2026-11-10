import type { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { deleteSampleChecklist } from "./deleteSampleChecklist";

const sections = [
    { name: "fabric", relation: "sample_check_list_fabric_images" },
    { name: "trims_accessories", relation: "sample_check_list_trims_accessories_images" },
    { name: "workmanship", relation: "sample_check_list_workmanship_images" },
    { name: "fitting", relation: "sample_check_list_fitting_images" },
    { name: "measurement", relation: "sample_check_list_measurement_images" },
    { name: "pattern", relation: "sample_check_list_pattern_images" },
    { name: "print_emb", relation: "sample_check_list_print_images" },
    { name: "wash", relation: "sample_check_list_wash_images" },
    { name: "labels", relation: "sample_check_list_labels_images" },
    { name: "risk_area", relation: "sample_check_list_risk_area_images" },
    { name: "other", relation: "sample_check_list_other_images" },
] as const;

const checklistId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const actionBy = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const checklistAccess = { buyer_id: 7 };
const snapshot = { buyer_id: 7, factory_id: 8, fabric: "Fabric comment", main_label: -1, size_label: 0, sample_check_date: new Date("2026-10-27") };

type FixtureOptions = { visible?: boolean; manual?: boolean; failure?: "images" | "parent" | "commit" };

const createFixture = async (context: TestContext, options: FixtureOptions = {}) => {
    const recordSnapshot = options.manual ? { ...snapshot, with_order: false, style_id: null, style_no_manual: "MANUAL-STYLE" } : snapshot;
    const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "nexus-sample-checklist-"));
    context.mock.method(process, "cwd", () => workingDirectory);
    context.after(async () => {
        context.mock.restoreAll();
        assert.equal(path.dirname(workingDirectory), path.resolve(os.tmpdir()));
        assert.match(path.basename(workingDirectory), /^nexus-sample-checklist-/);
        await fs.rm(workingDirectory, { recursive: true, force: true });
    });

    const images: Record<string, { id: string; url: string }[]> = {};
    const filePaths: string[] = [];
    for (const [index, section] of sections.entries()) {
        const imageId = `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
        const filePath = path.join(workingDirectory, "public", "sample_checklist", section.name, `${imageId}.jpg`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, `photo-${index}`);
        filePaths.push(filePath);
        images[section.relation] = [{ id: imageId, url: `/api/sample_checklist?checklistId=${checklistId}&section=${section.name}&imageId=${imageId}` }];
    }

    const unrelatedFile = path.join(path.dirname(filePaths[0]!), "ffffffff-ffff-4fff-8fff-ffffffffffff.jpg");
    await fs.writeFile(unrelatedFile, "another checklist photo");
    const state = { recordExists: true, imageRowsExist: true, history: [] as unknown[] };
    const events: string[] = [];
    const tx = {
        $queryRaw: async () => {
            events.push("lock");
            return [{ id: checklistId }];
        },
        sample_check_list: {
            findFirst: async (args: { where: { id: string; buyer_id: number } }) => {
                events.push("access");
                assert.equal(args.where.id, checklistId);
                assert.equal(args.where.buyer_id, checklistAccess.buyer_id);
                return options.visible === false ? null : recordSnapshot;
            },
            findUniqueOrThrow: async () => images,
            update: async (args: { data: Record<string, unknown> }) => {
                events.push("image-rows");
                for (const section of sections) assert.deepEqual(args.data[section.relation], { deleteMany: {} });
                if (options.failure === "images") throw new Error("Image record deletion failed");
                state.imageRowsExist = false;
                return { id: checklistId };
            },
            delete: async () => {
                events.push("parent");
                assert.equal(state.imageRowsExist, false);
                for (const filePath of filePaths) await assert.rejects(fs.access(filePath));
                if (options.failure === "parent") throw new Error("Parent deletion failed");
                state.recordExists = false;
                return { id: checklistId };
            },
        },
        sample_check_list_history: {
            create: async (args: { data: unknown }) => {
                state.history.push(args.data);
            },
        },
    };
    const db = {
        $transaction: async (callback: (transaction: typeof tx) => Promise<string>) => {
            try {
                const result = await callback(tx);
                if (options.failure === "commit") throw new Error("Commit failed");
                events.push("commit");
                return result;
            } catch (error) {
                state.recordExists = true;
                state.imageRowsExist = true;
                state.history = [];
                throw error;
            }
        },
    } as unknown as PrismaClient;

    const remove = () => deleteSampleChecklist(db, { id: checklistId, checklistAccess, actionBy });
    const assertPhotosIntact = async () => {
        for (const [index, filePath] of filePaths.entries()) assert.equal(await fs.readFile(filePath, "utf8"), `photo-${index}`);
        assert.equal(await fs.readFile(unrelatedFile, "utf8"), "another checklist photo");
    };

    return { remove, state, events, images, filePaths, unrelatedFile, assertPhotosIntact };
};

void test("delete removes all eleven image sections and the checklist, and records the deletion snapshot", async (context) => {
    const fixture = await createFixture(context);
    assert.equal(await fixture.remove(), checklistId);
    assert.equal(fixture.state.recordExists, false);
    assert.equal(fixture.state.imageRowsExist, false);
    assert.deepEqual(fixture.state.history, [{ ...snapshot, action_by: actionBy, action_type: "DELETE" }]);
    assert.deepEqual(fixture.events, ["lock", "access", "image-rows", "parent", "commit"]);
    assert.equal(await fs.readFile(fixture.unrelatedFile, "utf8"), "another checklist photo");
});

void test("already missing image files do not prevent checklist deletion", async (context) => {
    const fixture = await createFixture(context);
    await fs.unlink(fixture.filePaths[0]!);
    await fixture.remove();
    assert.equal(fixture.state.recordExists, false);
    assert.equal(fixture.state.imageRowsExist, false);
});

void test("a without-order checklist removes every photo and preserves its manual style in history", async (context) => {
    const fixture = await createFixture(context, { manual: true });
    await fixture.remove();
    assert.equal(fixture.state.recordExists, false);
    assert.deepEqual(fixture.state.history, [{ ...snapshot, with_order: false, style_id: null, style_no_manual: "MANUAL-STYLE", action_by: actionBy, action_type: "DELETE" }]);
});

void test("an inaccessible checklist cannot delete images, records or history", async (context) => {
    const fixture = await createFixture(context, { visible: false });
    await assert.rejects(fixture.remove(), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
    assert.deepEqual(fixture.events, ["lock", "access"]);
    assert.equal(fixture.state.history.length, 0);
    await fixture.assertPhotosIntact();
});

void test("a file removal failure restores earlier files and rolls back the database", async (context) => {
    const fixture = await createFixture(context);
    const originalUnlink = fs.unlink;
    context.mock.method(fs, "unlink", async (filename: Parameters<typeof fs.unlink>[0]) => {
        if (filename === fixture.filePaths[1]) throw Object.assign(new Error("File is locked"), { code: "EACCES" });
        return originalUnlink(filename);
    });
    await assert.rejects(fixture.remove(), /File is locked/);
    assert.equal(fixture.state.recordExists, true);
    assert.equal(fixture.state.imageRowsExist, true);
    assert.equal(fixture.state.history.length, 0);
    await fixture.assertPhotosIntact();
});

for (const failure of ["images", "parent", "commit"] as const) {
    void test(`a ${failure} database failure preserves the checklist and restores every photo`, async (context) => {
        const fixture = await createFixture(context, { failure });
        await assert.rejects(fixture.remove());
        assert.equal(fixture.state.recordExists, true);
        assert.equal(fixture.state.imageRowsExist, true);
        assert.equal(fixture.state.history.length, 0);
        await fixture.assertPhotosIntact();
    });
}

void test("stored URLs cannot target unrelated files", async (context) => {
    const fixture = await createFixture(context);
    fixture.images.sample_check_list_fabric_images![0]!.url = fixture.unrelatedFile;
    await fixture.remove();
    assert.equal(await fs.readFile(fixture.unrelatedFile, "utf8"), "another checklist photo");
});

void test("invalid image IDs cannot escape the checklist storage directory", async (context) => {
    const fixture = await createFixture(context);
    fixture.images.sample_check_list_fabric_images![0]!.id = "../../another-directory/photo";
    await assert.rejects(fixture.remove());
    assert.equal(fixture.state.recordExists, true);
    await fixture.assertPhotosIntact();
});
