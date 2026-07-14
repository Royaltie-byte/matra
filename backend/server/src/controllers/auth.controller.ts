import type { Request, Response } from "express";
import pool from "../config/db.js";
import { registerUser } from "../services/auth.service.js";
import { comparePassword , findUserByEmail , generateToken } from '../services/auth.service.js';



//============/register controller =========//

export const register = async (req: Request, res: Response) => {
    const {
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        password,
        role,
    } = req.body;
    
    // Basic input validation
    if (
        !organization_id ||
        !first_name ||
        !last_name ||
        !email ||
        !phone ||
        !password ||
        !role
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
        });
    }

    try {
        const user = await registerUser({
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            password,
            role,
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