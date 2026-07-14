import pool from "../config/db.js";
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();



//========UNDER REGISTRATION===========//

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

    //hashing the password using bcrypt.
    const hashedPassword = await bcrypt.hash(user.password,10)

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
            user.email.toLowerCase().trim(),
            user.phone,
            hashedPassword, // hashed using bcrypt.
            user.role,
            false,
        ]
    );

    return result.rows[0];
};


//===========UNDER LOGIN ============//

//a function comparePassword to compare the input to the one in the db

export const comparePassword = async (plainPassword: string , hashedPassword: string) => {
    return await bcrypt.compare(plainPassword , hashedPassword);
}


//function to find the user by email

export const findUserByEmail = async (email: string) =>{
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email.toLowerCase().trim()]
    )

    return result.rows[0];
}


//creating a function to generate the jwt
//used instead of sessions

export const generateToken = (user_id: string , organization_id: string , role: string) =>{
    //check if secret is defined.
    const secret = process.env.JWT_SECRET;
    
    if(!secret){
        throw new Error("JWT_SECRET is not defined!");
    }
    
    return jwt.sign(
        {
            //payload
            user_id,
            organization_id,
            role
        },
        secret,
        {
            expiresIn: "2d"
        }
    );
}

