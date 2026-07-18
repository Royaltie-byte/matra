import pool from "../config/db.js";
import type { Pool, PoolClient } from "pg";
import bcrypt from 'bcrypt';
import  jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// Either the plain pool (auto-commit, one-off queries) or a checked-out
// client that's part of an ongoing BEGIN/COMMIT/ROLLBACK transaction.
type DBClient = Pool | PoolClient;


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

interface OrganizationData{
    name: string;
    type: string;
    phone: string;
    email: string;
}




export const createOrganization = async ( organization: OrganizationData, db: DBClient = pool ) =>{
    const result = await db.query(
        `INSERT INTO organization(
            name,
            type,
            phone,
            email
        )
        VALUES($1,$2,$3,$4)
        RETURNING
            organization_id,
            name,
            type,
            phone,
            email,
            is_active,
            created_at`,

            [
                organization.name,
                organization.type,
                organization.phone,
                organization.email.toLowerCase().trim()
            ]
    )

    return result.rows[0];
}

export const createUser = async (user: RegisterUserData, db: DBClient = pool) => {

    //hashing the password using bcrypt.
    const hashedPassword = await bcrypt.hash(user.password,10)

    const result = await db.query(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7 , $8)
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
            true
        ]
    );

    return result.rows[0];
};

// Verify that the registering email doesn't exist (unique)
export const findOrganizationByEmail = async (email: string) => {
    const result = await pool.query(
        `
        SELECT organization_id
        FROM organization
        WHERE email = $1
        `,
        [email.toLowerCase().trim()]
    );

    return result.rows[0];
};

// Verify that each organization has a unique phone
export const findOrganizationByPhone = async (phone: string) => {
    const result = await pool.query(
        `
        SELECT organization_id
        FROM organization
        WHERE phone = $1
        `,
        [phone.trim()]
    );

    return result.rows[0];
};

// Ensure that admin phone is unique
export const findUserByPhone = async (phone: string) => {
    const result = await pool.query(
        `
        SELECT
            user_id,
            phone
        FROM users
        WHERE phone = $1
        `,
        [phone.trim()]
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
        `SELECT
            user_id,
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            password_hash,
            role,
            is_active
         FROM users WHERE email = $1`,
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
        throw new Error("JWT secret is not defined!");
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


//=============== UNDER INVITE ==============//
//create a new interface for creating a new invited user without the password

interface  InvitedUserData {
    organization_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
}


export const createInvitedUser = async (user: InvitedUserData) => {
    const result = await pool.query(
        `INSERT INTO users(
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            role,
            is_active
            )
        VALUES($1,$2,$3,$4,$5,$6,$7)
        RETURNING user_id , organization_id,first_name,last_name,email,phone,role,created_at`,
        [
            user.organization_id,
            user.first_name,
            user.last_name,
            user.email.toLowerCase().trim(),
            user.phone,
            user.role,
            false
        ]
    );
    return result.rows[0];
}


//creating an invite token , different from the login token , only purpose is 
//to invite.

export const generateInviteToken = (user_id: string) => {
    const secret = process.env.JWT_SECRET;

    if(!secret){
        throw new Error('JWT secret is not defined!');
    }

    //create the token.

    const token = jwt.sign(
        {
            user_id: user_id,
            type: "invite"
        },
        secret,
        {
            expiresIn:"1d"
        }

    );

    return token;
}


export const updatePassword = async (user_id: string , plainPassword: string ) => {
    //hash the password.
    const hashedPassword  = await bcrypt.hash(plainPassword,10);

    const result = await pool.query(
        `UPDATE  users
         SET password_hash = $1 , is_active = true
         WHERE user_id = $2
         RETURNING user_id,organization_id,first_name,last_name,email,phone,role`,
         [
            hashedPassword,
            user_id
         ]
    )

    //make sure that the user existed in the database
    if(result.rowCount === 0){
        throw new Error('User not found!');
    }

    return result.rows[0];
}

