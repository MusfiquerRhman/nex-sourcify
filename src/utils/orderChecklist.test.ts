import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTechnicalCheck, getTechnicalCheckValue, technicalCheckOptions, technicalCheckSchema } from "./orderChecklist";

void test("Technical options have the requested labels and numeric values", () => {
    assert.deepEqual(technicalCheckOptions, [{ label: "YES", value: 1 }, { label: "NO", value: -1 }, { label: "N/A", value: 0 }]);
});

for (const option of technicalCheckOptions) {
    void test(`Technical ${option.label} survives validation, editing and PDF formatting`, () => {
        assert.equal(technicalCheckSchema.parse(option.value), option.value);
        assert.equal(getTechnicalCheckValue(option.value), option.value);
        assert.equal(formatTechnicalCheck(option.value), option.label);
    });
}

for (const value of [true, false, "1", "-1", "0", 2, -2, 0.5, null, undefined]) {
    void test(`Technical rejects ${String(value)} instead of coercing it to a status`, () => {
        assert.equal(technicalCheckSchema.safeParse(value).success, false);
    });
}

void test("nullable legacy values display as N/A and unsupported values do not become YES", () => {
    assert.equal(getTechnicalCheckValue(null), 0);
    assert.equal(formatTechnicalCheck(null), "N/A");
    assert.equal(formatTechnicalCheck(2), "-");
});
