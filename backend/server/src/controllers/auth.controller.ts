import type { Request, Response } from "express";
import pool from "../config/db.js";
import { createUser } from "../services/auth.service.js";
import { comparePassword , findUserByEmail , generateToken , createOrganization  } from '../services/auth.service.js';



//============/register controller =========//

export const register = async (req: Request, res: Response) => {

    //instead of capturing all the fields as single entities , we capture 
    //two objects as shown below
    //this is what is sent by the frontend
    /* {
    //test data to test login from now on.

    "organization": {
        "name": "Royaltie Health",
        "type": "PRIVATE",
        "phone": "0778000000",
        "email": "royaltie@gmail.com"
    },
    "admin": {
        "first_name": "Allan",
        "last_name": "Kihiu",
        "email": "allan@gmail.com",
        "phone": "0778547599",
        "password": "12345"
    }
}
        */

    //req.body recieves two objecs now

    const { organization , admin } = req.body;

    if(!organization || !admin){
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        })
    }
    
    // Basic input validation
    //we don't collect the role in this part , cause basically it's the
    //super_admin doing the registration.
    if (
        !organization.name ||
        !organization.type ||
        !organization.phone ||
        !organization.email ||
        !admin.first_name ||
        !admin.last_name ||
        !admin.phone ||
        !admin.email ||
        !admin.password    
    ) 
    {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
        });
    }

    // Check out a single dedicated client from the pool. All queries for
    // this request must go through THIS client so they share one session/
    // transaction - if we used pool.query() for one of them, that query
    // could run on a different physical connection and wouldn't be part
    // of the same transaction.
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        //create the organization
        const org = await createOrganization({
            name: organization.name,
            type: organization.type,
            phone: organization.phone,
            email: organization.email
        }, client);

        //create the SUPER_ADMIN 
        const user = await createUser({
            organization_id: org.organization_id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            phone: admin.phone,
            password: admin.password,
            role:'SUPER_ADMIN'
        }, client);

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully.",
            data: user,
        });

    } catch (error) {

        // Something failed after the organization (and/or user) was
        // partially created - undo everything so we never end up with an
        // orphaned organization with no admin.
        await client.query('ROLLBACK');

        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed.",
        });
    }
    finally {
        // Always return the client to the pool, whether we committed,
        // rolled back, or something threw before either happened.
        client.release();
    }
};


//=============//login controller =============//

export const login = async (req: Request , res: Response ) => {
    try{
        
        //catch email and password from the request body
        const {email , password } = req.body;


        //check if email and password have been input
        if( !email || !password){
            return res.status(400).json({
                success: false,
                message: "All fields are required!"
            });
        }

        //check if the user email exists in the system.
        const user = await findUserByEmail(email);

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid email or password!"
            })
        }

        //compare the password with the one in the database
        const isValid = await comparePassword(password,user.password_hash);

        if(!isValid){
            return res.status(400).json({ 
                success: false,
                message:"Invalid email or password!"
            })
        }

        //if all are valid , continue with issuing the JWT token.

        const token = generateToken(user.user_id,user.organization_id,user.role);

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user:{
                user_id: user.user_id,
                organization_id: user.organization_id,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }
        })

    }catch(error){
        console.error(`Login error : ${error}`);
        return res.status(500).json({message: "Login Failed!"})
    }

}


//===============/me controller ==============//

export const me = (req:Request , res:Response ) => {
    res.status(200).json({
        success: true,
        message:req.user //sending the logged in user as a response.
    })
}



//==============/logout controller ==============//

export function logout(req: Request, res: Response): void {
    res.status(501).json({
        message: "Logout endpoint not implemented yet.",
    });
}

