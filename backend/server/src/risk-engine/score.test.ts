import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSymptomReport } from "./score.js";

// Table-driven: each case is one clinical scenario, in plain English, with
// the severity we expect out. Run with: node --test --import tsx src/risk-engine/score.test.ts

const cases: { name: string; input: string; expectedSeverity: string }[] = [
    // ---- Tier 1: single-concept overrides ----
    { name: "convulsions alone", input: "she is convulsing right now", expectedSeverity: "EMERGENCY" },
    { name: "heavy bleeding alone", input: "I am bleeding heavily since this morning", expectedSeverity: "EMERGENCY" },
    { name: "cant breathe alone", input: "I have difficulty breathing", expectedSeverity: "EMERGENCY" },
    { name: "fainted alone", input: "I fainted an hour ago", expectedSeverity: "EMERGENCY" },
    { name: "self-harm ideation", input: "I don't want to live anymore", expectedSeverity: "EMERGENCY" },

    // ---- Tier 1b: combination override ----
    { name: "headache + blurred vision together", input: "I have a bad headache and blurry vision", expectedSeverity: "EMERGENCY" },
    { name: "headache alone (no vision symptom)", input: "I have a headache", expectedSeverity: "LOW" },
    { name: "blurred vision alone (no headache)", input: "everything looks blurry today", expectedSeverity: "LOW" },

    // ---- Tier 2: weighted accumulation ----
    { name: "fever + swelling + abdominal pain (score 6)", input: "I have a fever, some swelling in my hands, and abdominal pain", expectedSeverity: "MODERATE" },
    { name: "fever + swelling + abdominal pain + nausea (score 7)", input: "fever, swollen hands, abdominal pain, and feeling sick", expectedSeverity: "HIGH" },
    { name: "mild fatigue only", input: "just feeling a bit tired", expectedSeverity: "LOW" },
    { name: "nausea + mild pain (score 2)", input: "feeling sick and a bit sore", expectedSeverity: "LOW" },

    // ---- Edge cases ----
    { name: "explicitly fine", input: "I'm fine, no problems", expectedSeverity: "LOW" },
    { name: "unrelated text, no symptom match", input: "my mother in law visited today", expectedSeverity: "LOW" },
    { name: "repeated keyword doesn't multiply score", input: "headache headache headache", expectedSeverity: "LOW" },
    { name: "typo variant still matches (migrane)", input: "I have a migrane", expectedSeverity: "LOW" },
    { name: "case-insensitive and punctuation-tolerant", input: "I CAN'T BREATHE!!", expectedSeverity: "EMERGENCY" },
];

for (const { name, input, expectedSeverity } of cases) {
    test(`scoreSymptomReport: ${name}`, () => {
        const result = scoreSymptomReport(input);
        assert.equal(
            result.severity,
            expectedSeverity,
            `input="${input}" expected ${expectedSeverity} but got ${result.severity} (score=${result.score}, matched=${result.matchedConcepts.join(",")})`
        );
    });
}

test("scoreSymptomReport: repeated keyword really doesn't multiply score", () => {
    const once = scoreSymptomReport("I have a headache");
    const thrice = scoreSymptomReport("headache headache headache");
    assert.equal(once.score, thrice.score, "matching the same concept multiple times should not increase the score");
});

test("scoreSymptomReport: override always wins even with unrelated weighted matches", () => {
    const result = scoreSymptomReport("feeling tired and a bit sore but also convulsing");
    assert.equal(result.severity, "EMERGENCY");
    assert.equal(result.overrideTriggered, true);
});