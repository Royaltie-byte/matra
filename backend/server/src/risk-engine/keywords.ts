// keywords definitions

export type Severity = "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";

export interface WeightedConceptDefinition {
    id: string;
    label: string;
    variants: string[];
    weight: number;
}

export interface OverrideConceptDefinition {
    id: string;
    label: string;
    variants: string[];
}

export interface CombinationOverrideDefinition {
    // All of these WEIGHTED_CONCEPTS ids must be matched in the same message to trigger.
    requiresConceptIds: string[];
    label: string;
}

// ============ TIER 1 - single-concept overrides ============
// Any one of these matching is an automatic EMERGENCY.

export const OVERRIDE_CONCEPTS: OverrideConceptDefinition[] = [
    {
        id: "convulsion",
        label: "convulsions / seizure",
        variants: ["convulsion", "convulsing", "seizure", "fitting", "shaking uncontrollably"],
    },
    {
        id: "heavy_bleeding",
        label: "heavy bleeding",
        variants: [
            "heavy bleeding",
            "soaking pad",
            "soaking through",
            "blood everywhere",
            "bleeding a lot",
            "bleeding heavily",
        ],
    },
    {
        id: "cant_breathe",
        label: "difficulty breathing",
        variants: ["cant breathe", "can not breathe", "difficulty breathing", "trouble breathing", "gasping"],
    },
    {
        id: "unconscious",
        label: "loss of consciousness",
        variants: ["fainted", "passed out", "unconscious", "unresponsive"],
    },
    {
        id: "self_harm",
        label: "self-harm risk",
        variants: ["hurt myself", "hurt my baby", "end it", "dont want to live", "not want to live", "kill myself"],
    },
];

// ============ TIER 2 - weighted concepts ============
// These sum toward a score, which is then bucketed into a severity by score.ts's SCORE_THRESHOLDS. 

export const WEIGHTED_CONCEPTS: WeightedConceptDefinition[] = [
    {
        id: "headache",
        label: "headache",
        variants: ["headache", "head ache", "head pounding", "migraine", "migrane"],
        weight: 2,
    },
    {
        id: "blurred_vision",
        label: "blurred vision",
        variants: ["blurred vision", "blurry vision", "seeing spots", "cant see properly", "blurry"],
        weight: 2,
    },
    {
        id: "fever",
        label: "fever",
        variants: ["fever", "feeling hot", "high temperature", "chills"],
        weight: 2,
    },
    {
        id: "foul_discharge",
        label: "foul-smelling discharge",
        variants: ["smelly discharge", "foul smell", "bad smell down there", "foul smelling"],
        weight: 2,
    },
    {
        id: "severe_abdominal_pain",
        label: "severe abdominal pain",
        variants: ["severe pain", "sharp pain stomach", "abdominal pain", "severe abdominal pain"],
        weight: 2,
    },
    {
        id: "swelling",
        label: "swelling",
        variants: ["swelling", "swollen face", "swollen hands", "swollen feet"],
        weight: 2,
    },
    {
        id: "nausea",
        label: "nausea / vomiting",
        variants: ["nausea", "vomiting", "throwing up", "feel sick", "feeling sick"],
        weight: 1,
    },
    {
        id: "fatigue",
        label: "fatigue",
        variants: ["tired", "exhausted", "no energy", "fatigued"],
        weight: 1,
    },
    {
        id: "mild_pain",
        label: "mild pain",
        variants: ["some pain", "a bit sore", "uncomfortable", "slight pain"],
        weight: 1,
    },
    {
        id: "feeling_fine",
        label: "feeling fine",
        variants: ["fine", "good", "okay", "no problems", "nothing", "im well", "i am well"],
        weight: 0,
    },
];

// ============ Combination overrides ============
// Neither concept alone triggers this - both must be matched in the SAME message

export const COMBINATION_OVERRIDES: CombinationOverrideDefinition[] = [
    {
        requiresConceptIds: ["headache", "blurred_vision"],
        label: "headache with visual disturbance (possible pre-eclampsia)",
    },
];