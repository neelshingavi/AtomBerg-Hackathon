/**
 * Run: npx tsx scripts/verify-edge-cases.ts
 * Validates critical business rules from Phase 6 checklist.
 */
import { validateSubmission } from "../src/lib/calculations/weightage";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

console.log("Edge case verification\n");

// 0 goals submit blocked
const empty = validateSubmission([]);
assert("0 goals → blocked", !empty.isValid && empty.errors.some((e) => e.includes("at least 1")));

// 99% weightage blocked
const ninetyNine = validateSubmission([{ title: "Only goal", weightage: 99 }]);
assert("99% total → blocked", !ninetyNine.isValid);

// 100% valid
const valid = validateSubmission([
  { title: "Goal A", weightage: 50 },
  { title: "Goal B", weightage: 50 },
]);
assert("50+50 = 100% → valid", valid.isValid);

// Min 10% per goal
const low = validateSubmission([{ title: "Low", weightage: 5 }]);
assert("5% single goal → blocked", !low.isValid);

// Max 8 goals
const nine = validateSubmission(
  Array.from({ length: 9 }, (_, i) => ({ title: `G${i}`, weightage: 11 }))
);
assert("9 goals → blocked", !nine.isValid);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
