import type { Request, Response } from "express";
import pool from "../config/db.js";
import { createUser } from "../services/auth.service.js";
import { updatePassword , comparePassword , findUserByEmail , generateToken , generateInviteToken , createOrganization, findOrganizationByEmail, findOrganizationByPhone, findUserByPhone , createInvitedUser } from '../services/auth.service.js';
import { isValidEmail, isValidPhone, isStrongPassword } from "../utils/validation.js";
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();



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

    // validating that the organization email and phone follow the correct standard format
    if (!isValidEmail(organization.email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid organization email."
        });
    }

    if (!isValidPhone(organization.phone)) {
        return res.status(400).json({
            success: false,
            message: "Invalid organization phone number."
        });
    }

    // validating that the admin email and phone follow the correct standard format
    if (!isValidEmail(admin.email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid administrator email."
        });
    }

    if (!isValidPhone(admin.phone)) {
        return res.status(400).json({
            success: false,
            message: "Invalid administrator phone number."
        });
    }

    // basic password validation, to be refined once every other validation works 
    if (!isStrongPassword(admin.password)) {
        return res.status(400).json({
            success: false,
            message:
                "Password must contain at least 8 characters."
        });
    }

    // Check if organization email already exists
    const existingOrganizationEmail = await findOrganizationByEmail(
        organization.email
    );

    if (existingOrganizationEmail) {
        return res.status(409).json({
            success: false,
            message: "Organization email already exists.",
        });
    }

    // Check if organization phone already exists
    const existingOrganizationPhone = await findOrganizationByPhone(organization.phone);

    if (existingOrganizationPhone) {
        return res.status(409).json({
            success: false,
            message: "Organization phone already exists.",
        });
    }

    // Check if admin email already exists
    const existingAdminEmail = await findUserByEmail(admin.email);

    if (existingAdminEmail) {
        return res.status(409).json({
            success: false,
            message: "Administrator email already exists."
        });
    }

    // Check if admin phone already exists
    const existingAdminPhone = await findUserByPhone(admin.phone);

    if (existingAdminPhone) {
        return res.status(409).json({
            success: false,
            message: "Administrator phone already exists."
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

        //check if the password_hash in the database is null.
        if(!user.password_hash){
            return res.status(400).json({
                success:false,
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


//==============/invite controller ===================//
//to invite someone ,we need , firstname, lastname, email , phone, organization_id,
//role


export const invite = async (req:Request , res: Response ) => {
    try{
        //add a defensive check to ensure req.user exists after authenticatToken runs

        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            })
        }

        //capture data from frontend.

        const { first_name , last_name , email , phone ,role } = req.body;

        if(!first_name || !last_name || !email || !phone || !role ){
            return res.status(400).json({
                success:false,
                message: "All fields are required!"
            })
        }

        //check if email exists
        const user = await findUserByEmail(email);
        if(user){
            return res.status(409).json({
                success:false,
                message: "A user with this email already exists!"
            })
        }
        
        //get organization id from req.user from authenticatToken.

        const organization_id = req.user.organization_id;

        //call createInvitedUser to create the user being invited.

        const invitedUser = await createInvitedUser({
            organization_id,
            first_name,
            last_name,
            email,
            phone,
            role
        });

        //invite token generation
        //takes , payload,jwt secret and one option
        const inviteToken = generateInviteToken(invitedUser.user_id);

        //check if token was generated.
        if (!inviteToken){
            throw new Error('Failed to create invite token!');
        }

        //inviting the user 
        return res.status(200).json({
            success: true,
            message: "Invite successful!",
            data: inviteToken, //here to be used during testing.
            user:{
                user_id: invitedUser.user_id,
                organization_id: invitedUser.organization_id,
                first_name:invitedUser.first_name,
                last_name:invitedUser.last_name,
                email:invitedUser.email,
                phone:invitedUser.phone,
                role:invitedUser.role
            }
        })
        
    }catch(error){
        console.error("Invitation error:",error);
        return res.status(500).json({
            success:false,
            message: " Failed to invite the user! "
        })
    }

}


//function to acceptInvite.

export const acceptInvite = async (req: Request , res: Response ) =>{
    //no middleware used for this route.

    //capture the users invite token and the password they are setting up.
    const {inviteToken , password } = req.body;

    if(!inviteToken || !password ){
        return res.status(400).json({
            success:false,
            message: "All fields are required!"
        })
    }

    //validate the password , ensure it is strong enough.
    if(!isStrongPassword(password)){
        return res.status(400).json({
            success:false,
            message: "Password must be atleast 8 characters!"
        })
    }

    //ensure the token is valid using jwt.verify() and check it's an invite token
    const secret = process.env.JWT_SECRET;

    if(!secret){
        throw new Error('JWT secret is not defined!');
    }

    try{
        const decoded = jwt.verify(inviteToken,secret) as JwtPayload & {
            type: string;  
            user_id: string;
        };

        //check if it's an invite type.

        if(decoded.type !== "invite"){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            })
        }

        //update the password hash into the database.

        const user = await updatePassword(decoded.user_id,password);

        return res.status(201).json({
            success: true,
            message: "Password has been updated successfully! Proceed to Login",
            user:{
                user_id:user.user_id,
                first_name:user.first_name,
                last_name:user.last_name,
                email:user.email,
                role:user.role
            }
        })
        


    }catch(error){
        console.error("Accept invite error:",error);
        return res.status(401).json({
            success:false,
            message: "Invalid or expired invite link!"
        })

    }
}

