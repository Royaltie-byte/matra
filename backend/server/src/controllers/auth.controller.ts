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
        organization:{
            name: organization.name,
            organization_type: organization.organization_type,
            phone: organization.phone,
            email: organization.email
        }
        admin:{
            first_name:,
            last_name:,
            email:,
            phone:,
            password:
            
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
        !organization.organization_type ||
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

    try {
        //create the organization
        //NOTE.
        console.log('BEGIN/COMMIT/ROLLBACK not implemented.');
        //this is to prevent cases of organization created and super admin fails
        //after implementing , delete this log.
        
        const org = await createOrganization({
            name: organization.name,
            organization_type: organization.organization_type,
            phone: organization.phone,
            email: organization.email
        });

        //create the SUPER_ADMIN 

        const user = await createUser({
            organization_id: org.organization_id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            phone: admin.phone,
            password: admin.password,
            role:'SUPER_ADMIN'
        });

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully.",
            data: user,
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed.",
        });
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



//==============/logout controller ==============//

export function logout(req: Request, res: Response): void {
    res.status(501).json({
        message: "Logout endpoint not implemented yet.",
    });
}

export function me(req: Request, res: Response): void {
    res.status(501).json({
        message: "Current user endpoint not implemented yet.",
    });
}