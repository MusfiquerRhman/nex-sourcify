/**
 * RMG normal single sampling: general inspection levels I, II and III.
 * Tables I and II-A, including their sample-size redirections:
 * https://variation.com/wp-content/uploads/standards/mil-std-105e.pdf
 * AQL 0 is an explicit zero-tolerance policy, not a Table II-A column.
 */
export type AqlInspectionLevel = "I" | "II" | "III";
export type AqlValue = 0 | 1.5 | 2.5 | 4;
export type AqlResult = "PASS" | "FAIL";
export type AqlDefectCategory = "critical" | "major" | "minor";
export type AqlDefectMatrix = Readonly<Record<AqlDefectCategory, number>>;
export type AqlSampleSizes = Readonly<Record<AqlDefectCategory, number>>;
export type AqlDefectLimits = Readonly<{ major: AqlValue; minor: AqlValue }>;

type SampleSizeCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "J" | "K" | "L" | "M" | "N" | "P" | "Q" | "R";
type TableAqlValue = Exclude<AqlValue, 0>;
type SamplingTableRow = Readonly<{
    sampleSize: number;
    limits: Readonly<Record<TableAqlValue, number | SampleSizeCode>>;
}>;

// A letter in a limits cell means use that letter's entire sampling plan.
const samplingTable = {
    A: { sampleSize: 2, limits: { 1.5: "D", 2.5: "C", 4: "B" } },
    B: { sampleSize: 3, limits: { 1.5: "D", 2.5: "C", 4: 0 } },
    C: { sampleSize: 5, limits: { 1.5: "D", 2.5: 0, 4: "B" } },
    D: { sampleSize: 8, limits: { 1.5: 0, 2.5: "C", 4: "E" } },
    E: { sampleSize: 13, limits: { 1.5: "D", 2.5: "F", 4: 1 } },
    F: { sampleSize: 20, limits: { 1.5: "G", 2.5: 1, 4: 2 } },
    G: { sampleSize: 32, limits: { 1.5: 1, 2.5: 2, 4: 3 } },
    H: { sampleSize: 50, limits: { 1.5: 2, 2.5: 3, 4: 5 } },
    J: { sampleSize: 80, limits: { 1.5: 3, 2.5: 5, 4: 7 } },
    K: { sampleSize: 125, limits: { 1.5: 5, 2.5: 7, 4: 10 } },
    L: { sampleSize: 200, limits: { 1.5: 7, 2.5: 10, 4: 14 } },
    M: { sampleSize: 315, limits: { 1.5: 10, 2.5: 14, 4: 21 } },
    N: { sampleSize: 500, limits: { 1.5: 14, 2.5: 21, 4: "M" } },
    P: { sampleSize: 800, limits: { 1.5: 21, 2.5: "N", 4: "M" } },
    Q: { sampleSize: 1250, limits: { 1.5: "P", 2.5: "N", 4: "M" } },
    R: { sampleSize: 2000, limits: { 1.5: "P", 2.5: "N", 4: "M" } },
} as const satisfies Record<SampleSizeCode, SamplingTableRow>;

const lotSizeTable: readonly { maximum: number; codes: Readonly<Record<AqlInspectionLevel, SampleSizeCode>> }[] = [
    { maximum: 8, codes: { I: "A", II: "A", III: "B" } },
    { maximum: 15, codes: { I: "A", II: "B", III: "C" } },
    { maximum: 25, codes: { I: "B", II: "C", III: "D" } },
    { maximum: 50, codes: { I: "C", II: "D", III: "E" } },
    { maximum: 90, codes: { I: "C", II: "E", III: "F" } },
    { maximum: 150, codes: { I: "D", II: "F", III: "G" } },
    { maximum: 280, codes: { I: "E", II: "G", III: "H" } },
    { maximum: 500, codes: { I: "F", II: "H", III: "J" } },
    { maximum: 1200, codes: { I: "G", II: "J", III: "K" } },
    { maximum: 3200, codes: { I: "H", II: "K", III: "L" } },
    { maximum: 10000, codes: { I: "J", II: "L", III: "M" } },
    { maximum: 35000, codes: { I: "K", II: "M", III: "N" } },
    { maximum: 150000, codes: { I: "L", II: "N", III: "P" } },
    { maximum: 500000, codes: { I: "M", II: "P", III: "Q" } },
    { maximum: Number.MAX_SAFE_INTEGER, codes: { I: "N", II: "Q", III: "R" } },
];

export type AqlSamplingPlan = Readonly<{
    codeLetter: SampleSizeCode | null;
    planCodeLetter: SampleSizeCode | null;
    sampleSize: number;
    acceptanceNumber: number;
    rejectionNumber: number;
    aql: AqlValue;
    isFullInspection: boolean;
}>;

export type AqlSamplingPlanInput = Readonly<{
    lotSize: number;
    inspectionLevel: AqlInspectionLevel;
    aql: AqlValue;
}>;

export type AqlInspectionInput = Readonly<{
    sampleSize: number | AqlSampleSizes;
    defectMatrix: AqlDefectMatrix;
    aql: AqlDefectLimits;
}> & (
    | Readonly<{ lotSize: number; inspectionLevel: AqlInspectionLevel }>
    | Readonly<{ lotSize?: never; inspectionLevel?: never }>
);

export type AqlCategoryResult = AqlSamplingPlan & Readonly<{ defectCount: number; result: AqlResult }>;
export type AqlInspectionResult = Readonly<{
    result: AqlResult;
    categories: Readonly<Record<AqlDefectCategory, AqlCategoryResult>>;
}>;

function validateCount(value: number, label: string, minimum = 0): void {
    if (!Number.isSafeInteger(value) || value < minimum) {
        throw new RangeError(`${label} must be a safe integer greater than or equal to ${minimum}.`);
    }
}

function validateAql(aql: AqlValue): void {
    if (aql !== 0 && aql !== 1.5 && aql !== 2.5 && aql !== 4) {
        throw new RangeError("Supported AQL values are 0 (zero tolerance), 1.5, 2.5 and 4.0.");
    }
}

function resolveSamplingPlan(codeLetter: SampleSizeCode, aql: AqlValue, lotSize?: number): AqlSamplingPlan {
    validateAql(aql);

    const cell = aql === 0 ? 0 : samplingTable[codeLetter].limits[aql];
    const planCodeLetter = typeof cell === "string" ? cell : codeLetter;
    const plan = samplingTable[planCodeLetter];
    const acceptanceNumber = aql === 0 ? 0 : plan.limits[aql];

    if (typeof acceptanceNumber !== "number") throw new Error("Invalid AQL sampling table redirection.");

    return {
        codeLetter,
        planCodeLetter,
        sampleSize: lotSize === undefined ? plan.sampleSize : Math.min(plan.sampleSize, lotSize),
        acceptanceNumber,
        rejectionNumber: acceptanceNumber + 1,
        aql,
        isFullInspection: lotSize !== undefined && plan.sampleSize >= lotSize,
    };
}

/** Returns the full plan, applying table arrows before capping the sample at the lot size. */
export function getAqlSamplingPlan(input: AqlSamplingPlanInput): AqlSamplingPlan {
    const { lotSize, inspectionLevel, aql } = input;
    validateCount(lotSize, "Lot size", 1);

    if (inspectionLevel !== "I" && inspectionLevel !== "II" && inspectionLevel !== "III") {
        throw new RangeError("Inspection level must be I, II or III.");
    }

    // A singleton lot is inspected in full, using the first lot-size band.
    const band = lotSizeTable.find((row) => lotSize <= row.maximum);
    if (!band) throw new RangeError("Lot size is outside the supported range.");

    return resolveSamplingPlan(band.codes[inspectionLevel], aql, lotSize);
}

function getPlanForInspectedSample(sampleSize: number, aql: AqlValue): AqlSamplingPlan {
    validateAql(aql);

    const entry = Object.entries(samplingTable).find(([, row]) => row.sampleSize === sampleSize);
    if (!entry) {
        throw new RangeError("Sample size must match a normal sampling table size; provide lotSize and inspectionLevel for full inspection.");
    }

    return resolveSamplingPlan(entry[0] as SampleSizeCode, aql);
}

/**
 * Counts are nonconformities in the inspected sample, grouped by severity.
 * Critical defects always use zero tolerance. Major/minor AQLs are explicit.
 * Each count must come from exactly its plan's sample; table arrows can give
 * different sample sizes per category. No proportional rounding is performed.
 * Invalid input or an incorrect sample size throws instead of reporting PASS.
 */
export function evaluateAql(input: AqlInspectionInput): AqlInspectionResult {
    const { sampleSize, defectMatrix, aql, lotSize, inspectionLevel } = input;

    if ((lotSize === undefined) !== (inspectionLevel === undefined)) {
        throw new RangeError("Provide both lotSize and inspectionLevel, or neither.");
    }

    const evaluateCategory = (category: AqlDefectCategory, qualityLimit: AqlValue): AqlCategoryResult => {
        const inspectedCount = typeof sampleSize === "number" ? sampleSize : sampleSize[category];
        const defectCount = defectMatrix[category];
        validateCount(inspectedCount, `${category} sample size`, 1);
        validateCount(defectCount, `${category} defect count`);

        if (lotSize !== undefined && inspectedCount > lotSize) {
            throw new RangeError(`${category} sample size cannot exceed the lot size.`);
        }

        // Without a lot, critical zero tolerance works for any positive sample size.
        if (qualityLimit === 0 && lotSize === undefined) {
            return {
                codeLetter: null,
                planCodeLetter: null,
                sampleSize: inspectedCount,
                acceptanceNumber: 0,
                rejectionNumber: 1,
                aql: 0,
                isFullInspection: false,
                defectCount,
                result: defectCount === 0 ? "PASS" : "FAIL",
            };
        }

        const plan = lotSize !== undefined && inspectionLevel !== undefined
            ? getAqlSamplingPlan({ lotSize, inspectionLevel, aql: qualityLimit })
            : getPlanForInspectedSample(inspectedCount, qualityLimit);

        if (inspectedCount !== plan.sampleSize) {
            throw new RangeError(`${category} at AQL ${qualityLimit} requires ${plan.sampleSize} inspected units; received ${inspectedCount}.`);
        }

        return { ...plan, defectCount, result: defectCount <= plan.acceptanceNumber ? "PASS" : "FAIL" };
    };

    const categories = {
        critical: evaluateCategory("critical", 0),
        major: evaluateCategory("major", aql.major),
        minor: evaluateCategory("minor", aql.minor),
    };

    return {
        result: Object.values(categories).every((category) => category.result === "PASS") ? "PASS" : "FAIL",
        categories,
    };
}

/** Convenience function for modules that only need the overall decision. */
export function getAqlResult(input: AqlInspectionInput): AqlResult {
    return evaluateAql(input).result;
}
