import pool from "../config/db.js";
import type { Pool, PoolClient } from "pg";

type DBClient = Pool | PoolClient;

export interface RiskAssessmentInput {
    enrollment_id: string;
    score: number;
    severity: string; 
    trigger_type: string; 
    triggered_by_message_id?: string;
    notes?: string;
}

const RISK_ASSESSMENT_COLUMNS = `
    risk_id,
    enrollment_id,
    score,
    severity,
    trigger_type,
    triggered_by_message_id,
    notes,
    created_at
`;

export const createRiskAssessment = async ( input: RiskAssessmentInput, db: DBClient = pool) => {
    const result = await db.query(
        `INSERT INTO risk_assessment (
            enrollment_id,
            score,
            severity,
            trigger_type,
            triggered_by_message_id,
            notes
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING ${RISK_ASSESSMENT_COLUMNS}`,
        [
            input.enrollment_id,
            input.score,
            input.severity,
            input.trigger_type,
            input.triggered_by_message_id ?? null,
            input.notes ?? null,
        ]
    );

    return result.rows[0];
};


export const findRiskAssessmentsByEnrollment = async ( enrollment_id: string, db: DBClient = pool) => {
    const result = await db.query(
        `SELECT ${RISK_ASSESSMENT_COLUMNS}
         FROM risk_assessment
         WHERE enrollment_id = $1
         ORDER BY created_at DESC`,
        [enrollment_id]
    );

    return result.rows;
};

export const findRiskAssessmentById = async ( risk_id: string, db: DBClient = pool) => {
    const result = await db.query(
        `SELECT ${RISK_ASSESSMENT_COLUMNS}
         FROM risk_assessment
         WHERE risk_id = $1`,
        [risk_id]
    );

    return result.rows[0];
};