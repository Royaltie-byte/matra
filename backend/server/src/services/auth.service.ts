import pool from "../config/db.js";

interface RegisterUserData {
    organization_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
}

export const registerUser = async (user: RegisterUserData) => {
    const result = await pool.query(
        `
        INSERT INTO users (
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            password_hash,
            role,
            is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
            user_id,
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            role,
            is_active,
            created_at
        `,
        [
            user.organization_id,
            user.first_name,
            user.last_name,
            user.email,
            user.phone,
            user.password, // before bcrypt implementation
            user.role,
            false,
        ]
    );

    return result.rows[0];
};