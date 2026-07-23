// scoring engine making use of normalized response text
import { normalizeText } from "./normalize.js";
import { WEIGHTED_CONCEPTS, OVERRIDE_CONCEPTS, COMBINATION_OVERRIDES, type Severity } from "./keywords.js";

export interface RiskScoreResult {
    score: number;
    severity: Severity;
    matchedConcepts: string[];
    overrideTriggered: boolean;
    overrideReason?: string;
    notes: string;
}

// Additive-score thresholds
const SCORE_THRESHOLDS = {
    moderate: 4,
    high: 7,
};

const scoreToSeverity = (score: number): Severity => {
    if (score >= SCORE_THRESHOLDS.high) return "HIGH";
    if (score >= SCORE_THRESHOLDS.moderate) return "MODERATE";
    return "LOW";
};


export const scoreSymptomReport = (rawText: string): RiskScoreResult => {
    const normalized = normalizeText(rawText);

    // Tier 2: collect weighted concept matches first (needed both for
    // the additive score AND to check the Tier 1b combination override). 
    const matchedConceptIds: string[] = [];
    let score = 0;

    for (const concept of WEIGHTED_CONCEPTS) {
        const matched = concept.variants.some((variant) => normalized.includes(normalizeText(variant)));
        if (matched) {
            matchedConceptIds.push(concept.id);
            score += concept.weight;
        }
    }

    // Tier 1: single-keyword overrides - any match forces EMERGENCY, no summing, checked before thresholds ever apply. 
    for (const override of OVERRIDE_CONCEPTS) {
        const matched = override.variants.some((variant) => normalized.includes(normalizeText(variant)));
        if (matched) {
            return {
                score,
                severity: "EMERGENCY",
                matchedConcepts: matchedConceptIds,
                overrideTriggered: true,
                overrideReason: `Danger sign detected: ${override.label}`,
                notes: `EMERGENCY override - danger sign detected: "${override.label}".`,
            };
        }
    }

    // Tier 1b: combination overrides 
    for (const combo of COMBINATION_OVERRIDES) {
        const allMatched = combo.requiresConceptIds.every((id) => matchedConceptIds.includes(id));
        if (allMatched) {
            return {
                score,
                severity: "EMERGENCY",
                matchedConcepts: matchedConceptIds,
                overrideTriggered: true,
                overrideReason: `Combination danger sign: ${combo.label}`,
                notes: `EMERGENCY override - combination danger sign: "${combo.label}" (${combo.requiresConceptIds.join(" + ")}).`,
            };
        }
    }

    // No override triggered - fall back to the additive weighted score. 
    const severity = scoreToSeverity(score);

    const notes =
        matchedConceptIds.length > 0
            ? `Matched: ${matchedConceptIds.join(", ")}. Score: ${score}.`
            : `No recognized symptoms matched - flag for manual review of unclear reply.`;

    return {
        score,
        severity,
        matchedConcepts: matchedConceptIds,
        overrideTriggered: false,
        notes,
    };
};