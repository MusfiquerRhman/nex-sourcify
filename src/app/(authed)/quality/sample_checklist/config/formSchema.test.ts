import assert from "node:assert/strict";
import { test } from "node:test";
import { sampleChecklistFormSchema } from "./formSchema";

const validChecklist = {
    with_order: true,
    sample_check_date: "2026-10-30",
    buyer_id: 7,
    factory_id: 8,
    order_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    style_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    style_no_manual: "",
    color_id: 9,
    sample_type: 1,
    status: 1,
    sample_size: "M",
    sample_quantity: 5,
    fabric: "Fabric comments",
    trims_accessories: "",
    workmanship: "",
    fitting: "",
    measurement: "",
    pattern: "",
    print_emb: "",
    wash: "",
    main_label: 1,
    main_label_position: 1,
    size_label: 0,
    size_label_position: 0,
    care_label: -1,
    care_label_position: -1,
    risk_area: "Risk comments",
};

void test("with-order checklists require an order and linked style", () => {
    assert.equal(sampleChecklistFormSchema.safeParse(validChecklist).success, true);
    for (const field of ["order_id", "style_id"] as const) {
        const result = sampleChecklistFormSchema.safeParse({ ...validChecklist, [field]: "" });
        assert.equal(result.success, false);
        if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === field));
    }
});

void test("without-order checklists accept a trimmed manual style and no order/style IDs", () => {
    const result = sampleChecklistFormSchema.parse({ ...validChecklist, with_order: false, order_id: "", style_id: "", style_no_manual: "  MANUAL-STYLE  " });
    assert.equal(result.with_order, false);
    assert.equal(result.style_no_manual, "MANUAL-STYLE");
    assert.equal(result.fabric, validChecklist.fabric);
    assert.equal(result.risk_area, validChecklist.risk_area);
});

for (const style of ["", "   ", "X".repeat(51)]) {
    void test(`without-order checklists reject an empty or oversized manual style (${style.length} characters)`, () => {
        const result = sampleChecklistFormSchema.safeParse({ ...validChecklist, with_order: false, order_id: "", style_id: "", style_no_manual: style });
        assert.equal(result.success, false);
        if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === "style_no_manual"));
    });
}

for (const withOrder of [true, false]) {
    for (const quantity of [undefined, null, Number.NaN, "", -1, 1.5, 2147483648]) {
        void test(`quantity ${String(quantity)} is rejected when with_order is ${String(withOrder)}`, () => {
            const result = sampleChecklistFormSchema.safeParse({ ...validChecklist, with_order: withOrder, style_no_manual: "MANUAL", sample_quantity: quantity });
            assert.equal(result.success, false);
            if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === "sample_quantity"));
        });
    }
}

void test("zero is an explicitly supplied quantity and size remains optional", () => {
    assert.equal(sampleChecklistFormSchema.safeParse({ ...validChecklist, sample_quantity: 0, sample_size: "" }).success, true);
});

void test("the existing NOT OKAY label option is preserved", () => {
    assert.equal(sampleChecklistFormSchema.parse({ ...validChecklist, main_label: -2 }).main_label, -2);
});

void test("checklist status accepts only numeric Pass, Passed with Comments, and Fail values", () => {
    for (const status of [1, 0, -1]) {
        assert.equal(sampleChecklistFormSchema.parse({ ...validChecklist, status }).status, status);
    }
    for (const status of [undefined, null, Number.NaN, "1", "0", "-1", true, false, -2, 2]) {
        const result = sampleChecklistFormSchema.safeParse({ ...validChecklist, status });
        assert.equal(result.success, false);
        if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === "status"));
    }
});

void test("client-supplied checker identity is excluded from checklist input", () => {
    const parsed = sampleChecklistFormSchema.parse({ ...validChecklist, checked_by: "cccccccc-cccc-4ccc-cccc-cccccccccccc" });
    assert.equal("checked_by" in parsed, false);
});
