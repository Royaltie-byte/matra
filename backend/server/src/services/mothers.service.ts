import pool from "../config/db.js";
import type { Pool, PoolClient } from "pg";

// Either the plain pool (auto-commit, one-off queries) or a checked-out
// client that's part of an ongoing BEGIN/COMMIT/ROLLBACK transaction.
type DBClient = Pool | PoolClient;

export interface MotherInput {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    date_of_birth?: string; // ISO date string, e.g. "1994-03-12"
    national_id?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
}

export interface MotherUpdateInput {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    national_id?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
}

const MOTHER_COLUMNS = `
    mother_id,
    organization_id,
    first_name,
    last_name,
    phone,
    email,
    date_of_birth,
    national_id,
    next_of_kin_name,
    next_of_kin_phone,
    created_at,
    updated_at
`;

//===========CREATE ===========//

export const createMother = async ( organization_id: string, mother: MotherInput, db: DBClient = pool ) => {
    const result = await db.query(
        `INSERT INTO mother (
            organization_id,
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            national_id,
            next_of_kin_name,
            next_of_kin_phone
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING ${MOTHER_COLUMNS}`,
        [
            organization_id,
            mother.first_name,
            mother.last_name,
            mother.phone.trim(),
            mother.email ? mother.email.toLowerCase().trim() : null,
            mother.date_of_birth || null,
            mother.national_id || null,
            mother.next_of_kin_name || null,
            mother.next_of_kin_phone || null,
        ]
    );

    return result.rows[0];
};

//===========READ ===========//

// requireOrgScope in practice: every read takes organization_id from
// req.user (set by authenticateToken from the JWT) and filters on it here
// at the query layer - never trust an organization_id from the client.

export const findMothersByOrganization = async ( organization_id: string, db: DBClient = pool ) => {
    const result = await db.query(
        `SELECT ${MOTHER_COLUMNS}
         FROM mother
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [organization_id]
    );

    return result.rows;
};

export const findMotherById = async ( mother_id: string, organization_id: string, db: DBClient = pool ) => {
    const result = await db.query(
        `SELECT ${MOTHER_COLUMNS}
         FROM mother
         WHERE mother_id = $1 AND organization_id = $2`,
        [mother_id, organization_id]
    );

    return result.rows[0];
};

// phone isn't a DB-level unique constraint (only email is, globally), so
// we enforce "no duplicate phone within the same org" here at the app layer.
export const findMotherByPhone = async ( phone: string, organization_id: string, db: DBClient = pool ) => {
    const result = await db.query(
        `SELECT * 
         FROM mother
         WHERE phone = $1 AND organization_id = $2`, //phone and org id are required elsewhere hence the change.(not actually required but won't really affect anything)

        [phone.trim(), organization_id]
    );

    return result.rows[0];
};

// email IS globally unique at the DB level (see schema), so this check is
// intentionally NOT organization-scoped.
export const findMotherByEmail = async ( email: string, db: DBClient = pool ) => {
    const result = await db.query(
        `SELECT mother_id, email
         FROM mother
         WHERE email = $1`,
        [email.toLowerCase().trim()]
    );

    return result.rows[0];
};

//===========UPDATE ===========//

export const updateMother = async ( mother_id: string, organization_id: string, updates: MotherUpdateInput, db: DBClient = pool ) => {
    const fieldMap: Record<string, string | undefined> = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone: updates.phone?.trim(),
        email: updates.email ? updates.email.toLowerCase().trim() : updates.email,
        date_of_birth: updates.date_of_birth,
        national_id: updates.national_id,
        next_of_kin_name: updates.next_of_kin_name,
        next_of_kin_phone: updates.next_of_kin_phone,
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

    // Nothing to update - let the controller decide how to respond
    // (distinct from "mother not found", which is checked separately).
    if (setClauses.length === 0) {
        return null;
    }

    setClauses.push(`updated_at = NOW()`);

    values.push(mother_id, organization_id);

    const result = await db.query(
        `UPDATE mother
         SET ${setClauses.join(', ')}
         WHERE mother_id = $${i} AND organization_id = $${i + 1}
         RETURNING ${MOTHER_COLUMNS}`,
        values
    );

    return result.rows[0];
};