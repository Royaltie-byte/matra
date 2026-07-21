import pool from "../config/db.js";
import type { Pool, PoolClient } from "pg";

type DBClient = Pool | PoolClient;

export interface DeliveryInput {
    delivery_date: string; // ISO date string, e.g. "2026-06-01"
    delivery_type: string; // NORMAL | CAESARIAN | VACUUM | FORCEPS
    birth_outcome: string; // LIVE_BIRTH | STILL_BIRTH
    gestational_age_weeks?: number;
    birth_weight_grams?: number;
    blood_loss_ml?: number;
    placenta_delivery?: string; // NORMAL | MANUAL | RETAINED
    complications?: string;
    existing_conditions?: string[];
}

export interface DeliveryUpdateInput {
    delivery_date?: string;
    delivery_type?: string;
    birth_outcome?: string;
    gestational_age_weeks?: number;
    birth_weight_grams?: number;
    blood_loss_ml?: number;
    placenta_delivery?: string;
    complications?: string;
    existing_conditions?: string[];
}

const DELIVERY_COLUMNS = `
    delivery_id,
    enrollment_id,
    delivery_date,
    delivery_type,
    gestational_age_weeks,
    birth_outcome,
    birth_weight_grams,
    blood_loss_ml,
    placenta_delivery,
    complications,
    existing_conditions,
    created_at
`;

//=========== CREATE ===========//

export const createDeliveryRecord = async ( enrollment_id: string, delivery: DeliveryInput, db: DBClient = pool) => {
    const result = await db.query(
        `INSERT INTO delivery (
            enrollment_id,
            delivery_date,
            delivery_type,
            gestational_age_weeks,
            birth_outcome,
            birth_weight_grams,
            blood_loss_ml,
            placenta_delivery,
            complications,
            existing_conditions
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING ${DELIVERY_COLUMNS}`,
        [
            enrollment_id,
            delivery.delivery_date,
            delivery.delivery_type,
            delivery.gestational_age_weeks ?? null,
            delivery.birth_outcome,
            delivery.birth_weight_grams ?? null,
            delivery.blood_loss_ml ?? null,
            delivery.placenta_delivery ?? null,
            delivery.complications ?? null,
            delivery.existing_conditions ?? null,
        ]
    );

    return result.rows[0];
};

//=========== READ ===========//

// Org-scoping for delivery happens one level up: the controller must first
// confirm the enrollment belongs to req.user.organization_id (via
// findEnrollmentById from enrollment.service.ts) before ever calling this.
// delivery has no organization_id column of its own - it only makes sense
// in the context of an enrollment that's already been scope-checked.
export const findDeliveryByEnrollmentId = async ( enrollment_id: string, db: DBClient = pool) => {
    const result = await db.query(
        `SELECT ${DELIVERY_COLUMNS}
         FROM delivery
         WHERE enrollment_id = $1`,
        [enrollment_id]
    );

    return result.rows[0];
};

//=========== UPDATE ===========//

export const updateDeliveryRecord = async ( enrollment_id: string, updates: DeliveryUpdateInput, db: DBClient = pool) => {
    const fieldMap: Record<string, unknown> = {
        delivery_date: updates.delivery_date,
        delivery_type: updates.delivery_type,
        gestational_age_weeks: updates.gestational_age_weeks,
        birth_outcome: updates.birth_outcome,
        birth_weight_grams: updates.birth_weight_grams,
        blood_loss_ml: updates.blood_loss_ml,
        placenta_delivery: updates.placenta_delivery,
        complications: updates.complications,
        existing_conditions: updates.existing_conditions,
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [column, value] of Object.entries(fieldMap)) {
        if (value !== undefined) {
            setClauses.push(`${column} = $${i}`);
            values.push(value);
            i++;
        }
    }

    // Nothing to update - let the controller turn this into a 400
    // (distinct from "delivery record not found").
    if (setClauses.length === 0) {
        return null;
    }

    // NOTE: no updated_at column on `delivery` in the current schema,
    // so unlike mothers.service.ts we don't set one here.

    values.push(enrollment_id);

    const result = await db.query(
        `UPDATE delivery
         SET ${setClauses.join(', ')}
         WHERE enrollment_id = $${i}
         RETURNING ${DELIVERY_COLUMNS}`,
        values
    );

    return result.rows[0];
};