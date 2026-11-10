# AQL utilities for RMG inspections

`aql.ts` implements **normal, single sampling** for general inspection levels
**I, II and III**, and AQL values **1.5, 2.5 and 4.0**. It follows Table I and
Table II-A, including upward/downward sample-size arrows, from
[MIL-STD-105E](https://variation.com/wp-content/uploads/standards/mil-std-105e.pdf).
This implements those sampling tables, rather than a complete inspection scheme
with switching rules, tightened/reduced inspection or double/multiple sampling.

Inspection level selects a code letter using the **lot size**. The AQL then selects
the actual sample size and acceptance/rejection numbers. These are table lookups;
do not multiply the sample size by the AQL percentage or interpolate a custom size.

## Plan an inspection

```ts
import { getAqlSamplingPlan } from "~/utils/aql";

const plan = getAqlSamplingPlan({
    lotSize: 3000,
    inspectionLevel: "II",
    aql: 2.5,
});
// sampleSize: 125, acceptanceNumber: 7, rejectionNumber: 8
```

For the same lot at AQL 2.5, level I uses 50 samples (Ac 3 / Re 4), and level III
uses 200 samples (Ac 10 / Re 11). When a required sample reaches or exceeds the
lot size, inspect the entire lot. Singleton lots are also inspected in full.

## Return PASS or FAIL

```ts
import { evaluateAql, getAqlResult } from "~/utils/aql";

const input = {
    lotSize: 3000,
    inspectionLevel: "II",
    sampleSize: 125,
    defectMatrix: { critical: 0, major: 7, minor: 10 },
    aql: { major: 2.5, minor: 4 },
} as const;

getAqlResult(input); // "PASS"
evaluateAql(input); // Overall decision and per-category counts, limits and plans.
```

Critical defects always have **zero tolerance**. `0` can also be selected for
major/minor zero-tolerance policies; it is not a standard Table II-A AQL column.
Each severity's count is a nonnegative integer count of **nonconformities** found
in its inspected sample, not a defect percentage or a measurement deviation.
Multiple nonconformities on a garment can be counted; counts are not constrained
to the number of inspected garments. All three severity counts must be supplied.
Every category must pass; an acceptance number is inclusive, and the next count
fails. Configure major/minor AQLs explicitly for the buyer's requirements.

If the inspected sample is already known, `lotSize` and `inspectionLevel` can both
be omitted. The utility then validates that the sample is a supported table size
for each selected AQL. General inspection levels have no further effect once the
correct sample size has been determined.

## Handle sample-size arrows

Standard rules sometimes differ from simplified RMG charts. For example, a
level II lot of 91-150 at AQL 1.5 redirects from code F (20) to code G (32), with
Ac 1 / Re 2. A sample of 20 is not evaluated using that plan. At AQL 4.0, code N
(500) redirects upward to code M (315), with Ac 21 / Re 22.

When categories need different samples, use their respective actual inspected
counts rather than silently applying one sample's limits to a different sample:

```ts
getAqlResult({
    lotSize: 60000,
    inspectionLevel: "III",
    sampleSize: { critical: 800, major: 500, minor: 315 },
    defectMatrix: { critical: 0, major: 21, minor: 21 },
    aql: { major: 2.5, minor: 4 },
}); // "PASS"
```

Each category's count must come from the corresponding planned sample or a
preselected subset of that size. Do not use the total defects from a larger sample
against a smaller plan's limits, or choose a subset after seeing its defects.
Invalid inputs and mismatched sample sizes throw `RangeError`; they do not produce
a misleading inspection decision. This utility does not select random garments.

## Verification

Tests use Node's built-in test runner and the project's existing TypeScript
compiler. From the project root in PowerShell:

```powershell
npx tsc src/utils/aql.ts src/utils/aql.test.ts --target ES2022 --module commonjs --esModuleInterop --strict --skipLibCheck --outDir "$env:TEMP/nexus-aql-tests"
node --test "$env:TEMP/nexus-aql-tests/aql.test.js"
```
