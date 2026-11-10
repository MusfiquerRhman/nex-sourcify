import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateAql, getAqlResult, getAqlSamplingPlan } from "./aql";
import type { AqlInspectionInput, AqlInspectionLevel, AqlValue } from "./aql";

const inspectionLevels: readonly AqlInspectionLevel[] = ["I", "II", "III"];

// Independent fixtures from Table I: upper lot boundary and nominal samples I/II/III.
const lotBands = [
    { maximum: 8, samples: [2, 2, 3] },
    { maximum: 15, samples: [2, 3, 5] },
    { maximum: 25, samples: [3, 5, 8] },
    { maximum: 50, samples: [5, 8, 13] },
    { maximum: 90, samples: [5, 13, 20] },
    { maximum: 150, samples: [8, 20, 32] },
    { maximum: 280, samples: [13, 32, 50] },
    { maximum: 500, samples: [20, 50, 80] },
    { maximum: 1200, samples: [32, 80, 125] },
    { maximum: 3200, samples: [50, 125, 200] },
    { maximum: 10000, samples: [80, 200, 315] },
    { maximum: 35000, samples: [125, 315, 500] },
    { maximum: 150000, samples: [200, 500, 800] },
    { maximum: 500000, samples: [315, 800, 1250] },
    { maximum: Number.MAX_SAFE_INTEGER, samples: [500, 1250, 2000] },
] as const;

const standardPlans = [
    { lotSize: 2, samples: [2, 2, 2], accepted: [0, 0, 0] },
    { lotSize: 10, samples: [8, 5, 3], accepted: [0, 0, 0] },
    { lotSize: 20, samples: [8, 5, 3], accepted: [0, 0, 0] },
    { lotSize: 40, samples: [8, 5, 13], accepted: [0, 0, 1] },
    { lotSize: 60, samples: [8, 20, 13], accepted: [0, 1, 1] },
    { lotSize: 100, samples: [32, 20, 20], accepted: [1, 1, 2] },
    { lotSize: 200, samples: [32, 32, 32], accepted: [1, 2, 3] },
    { lotSize: 400, samples: [50, 50, 50], accepted: [2, 3, 5] },
    { lotSize: 1000, samples: [80, 80, 80], accepted: [3, 5, 7] },
    { lotSize: 3000, samples: [125, 125, 125], accepted: [5, 7, 10] },
    { lotSize: 9000, samples: [200, 200, 200], accepted: [7, 10, 14] },
    { lotSize: 20000, samples: [315, 315, 315], accepted: [10, 14, 21] },
    { lotSize: 60000, samples: [500, 500, 315], accepted: [14, 21, 21] },
    { lotSize: 300000, samples: [800, 500, 315], accepted: [21, 21, 21] },
    { lotSize: 600000, samples: [800, 500, 315], accepted: [21, 21, 21] },
] as const;

const aqlValues: readonly AqlValue[] = [1.5, 2.5, 4];
const passingInput: AqlInspectionInput = {
    lotSize: 3000,
    inspectionLevel: "II",
    sampleSize: 125,
    defectMatrix: { critical: 0, major: 7, minor: 10 },
    aql: { major: 2.5, minor: 4 },
};

void test("all lot boundaries select the correct nominal sample for I, II and III", () => {
    let minimum = 2;

    for (const band of lotBands) {
        for (const lotSize of [minimum, band.maximum]) {
            inspectionLevels.forEach((inspectionLevel, index) => {
                const plan = getAqlSamplingPlan({ lotSize, inspectionLevel, aql: 0 });
                assert.equal(plan.sampleSize, Math.min(band.samples[index]!, lotSize), `${lotSize}, level ${inspectionLevel}`);
            });
        }

        minimum = band.maximum + 1;
    }
});

void test("normal plans resolve both upward and downward arrows for every supported AQL", () => {
    for (const fixture of standardPlans) {
        aqlValues.forEach((aql, index) => {
            const plan = getAqlSamplingPlan({ lotSize: fixture.lotSize, inspectionLevel: "II", aql });
            assert.equal(plan.sampleSize, fixture.samples[index]);
            assert.equal(plan.acceptanceNumber, fixture.accepted[index]);
            assert.equal(plan.rejectionNumber, fixture.accepted[index]! + 1);
        });
    }

    const redirected = getAqlSamplingPlan({ lotSize: 100, inspectionLevel: "II", aql: 1.5 });
    assert.equal(redirected.codeLetter, "F");
    assert.equal(redirected.planCodeLetter, "G");
});

void test("each standard plan passes at Ac and fails at Re for all three inspection levels", () => {
    for (const inspectionLevel of inspectionLevels) {
        for (const fixture of standardPlans) {
            for (const aql of aqlValues) {
                const plan = getAqlSamplingPlan({ lotSize: fixture.lotSize, inspectionLevel, aql });
                const criticalPlan = getAqlSamplingPlan({ lotSize: fixture.lotSize, inspectionLevel, aql: 0 });
                const input: AqlInspectionInput = {
                    lotSize: fixture.lotSize,
                    inspectionLevel,
                    sampleSize: { critical: criticalPlan.sampleSize, major: plan.sampleSize, minor: plan.sampleSize },
                    defectMatrix: { critical: 0, major: plan.acceptanceNumber, minor: plan.acceptanceNumber },
                    aql: { major: aql, minor: aql },
                };

                assert.equal(getAqlResult(input), "PASS");
                assert.equal(getAqlResult({ ...input, defectMatrix: { ...input.defectMatrix, major: plan.rejectionNumber } }), "FAIL");
                assert.equal(getAqlResult({ ...input, defectMatrix: { ...input.defectMatrix, minor: plan.rejectionNumber } }), "FAIL");
            }
        }
    }
});

void test("major and minor limits apply independently, and any critical defect fails", () => {
    const result = evaluateAql(passingInput);
    assert.equal(result.result, "PASS");
    assert.equal(result.categories.major.acceptanceNumber, 7);
    assert.equal(result.categories.minor.acceptanceNumber, 10);
    assert.equal(getAqlResult({ ...passingInput, defectMatrix: { critical: 1, major: 0, minor: 0 } }), "FAIL");
    assert.equal(getAqlResult({ ...passingInput, defectMatrix: { critical: 0, major: 8, minor: 0 } }), "FAIL");
    assert.equal(getAqlResult({ ...passingInput, defectMatrix: { critical: 0, major: 0, minor: 11 } }), "FAIL");
    assert.equal(getAqlResult({ ...passingInput, aql: { major: 1.5, minor: 4 } }), "FAIL");
});

void test("a known sample can be evaluated without a lot or inspection level", () => {
    const input: AqlInspectionInput = {
        sampleSize: 125,
        defectMatrix: { critical: 0, major: 7, minor: 10 },
        aql: { major: 2.5, minor: 4 },
    };

    assert.equal(getAqlResult(input), "PASS");
    assert.equal(evaluateAql(input).categories.critical.codeLetter, null);
    assert.equal(getAqlResult({ ...input, aql: { major: 0, minor: 4 } }), "FAIL");
});

void test("different category sample sizes handle arrows without comparing the wrong samples", () => {
    const input: AqlInspectionInput = {
        lotSize: 60000,
        inspectionLevel: "III",
        sampleSize: { critical: 800, major: 500, minor: 315 },
        defectMatrix: { critical: 0, major: 21, minor: 21 },
        aql: { major: 2.5, minor: 4 },
    };

    assert.equal(getAqlResult(input), "PASS");
    assert.throws(() => getAqlResult({ ...input, sampleSize: 800 }), /major.*requires 500/);
    assert.throws(() => getAqlResult({ ...passingInput, sampleSize: 80 }), /requires 125/);
    assert.throws(() => getAqlResult({ ...passingInput, sampleSize: 200 }), /requires 125/);
});

void test("an existing sample cannot bypass the standard arrow rules", () => {
    const input: AqlInspectionInput = {
        sampleSize: 20,
        defectMatrix: { critical: 0, major: 0, minor: 0 },
        aql: { major: 1.5, minor: 4 },
    };

    assert.throws(() => getAqlResult(input), /major.*requires 32/);
    assert.throws(() => getAqlResult({ ...input, sampleSize: 13, aql: { major: 2.5, minor: 4 } }), /major.*requires 20/);
    assert.throws(() => getAqlResult({ ...input, sampleSize: 500, aql: { major: 2.5, minor: 4 } }), /minor.*requires 315/);
});

void test("very small lots are inspected in full, including singleton lots", () => {
    for (const lotSize of [1, 2]) {
        const plan = getAqlSamplingPlan({ lotSize, inspectionLevel: "II", aql: 1.5 });
        assert.equal(plan.sampleSize, lotSize);
        assert.equal(plan.isFullInspection, true);
        assert.equal(plan.acceptanceNumber, 0);
        const input: AqlInspectionInput = {
            lotSize,
            inspectionLevel: "II",
            sampleSize: lotSize,
            defectMatrix: { critical: 0, major: 0, minor: 0 },
            aql: { major: 1.5, minor: 4 },
        };

        assert.equal(getAqlResult(input), "PASS");
        assert.equal(getAqlResult({ ...input, defectMatrix: { critical: 0, major: 1, minor: 0 } }), "FAIL");
    }
});

void test("invalid numbers and unsupported AQLs or levels are rejected", () => {
    for (const lotSize of [0, -1, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => getAqlSamplingPlan({ lotSize, inspectionLevel: "II", aql: 2.5 }), RangeError);
    }

    for (const sampleSize of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => getAqlResult({ ...passingInput, sampleSize }), RangeError);
    }

    for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => getAqlResult({ ...passingInput, defectMatrix: { critical: 0, major: count, minor: 0 } }), RangeError);
    }

    assert.throws(() => getAqlSamplingPlan({ lotSize: 100, inspectionLevel: "IV" as AqlInspectionLevel, aql: 2.5 }), RangeError);
    assert.throws(() => getAqlSamplingPlan({ lotSize: 100, inspectionLevel: "II", aql: 3 as AqlValue }), RangeError);
    assert.throws(() => getAqlResult({ ...passingInput, aql: { major: 3 as AqlValue, minor: 4 } }), RangeError);
    assert.throws(() => getAqlResult({ ...passingInput, sampleSize: 4000 }), /cannot exceed the lot size/);
});

void test("invalid later categories are validated even when an earlier category fails", () => {
    assert.throws(() => getAqlResult({ ...passingInput, defectMatrix: { critical: 1, major: 0, minor: -1 } }), RangeError);
    assert.throws(() => getAqlResult({ ...passingInput, defectMatrix: { critical: 0, major: 8, minor: NaN } }), RangeError);
});
