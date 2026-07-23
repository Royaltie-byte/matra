import type { Pool, PoolClient } from "pg";
import { scoreSymptomReport } from "../risk-engine/score.js";
import { createRiskAssessment } from "./risk-assessment.service.js";

type DBClient = Pool | PoolClient;
// The single integration point between the messaging/webhook flow and the
// risk engine. Call this once an inbound SMS reply has already been stored
 
export const evaluateSymptomReport = async ( enrollment_id: string, message_id: string, replyText: string, db?: DBClient ) => {
    const result = scoreSymptomReport(replyText);

    const riskAssessment = await createRiskAssessment(
        {
            enrollment_id,
            score: result.score,
            severity: result.severity,
            trigger_type: "SYMPTOM_REPORT",
            triggered_by_message_id: message_id,
            notes: result.notes,
        },
        db
    );


    return { ...result, riskAssessment };
};