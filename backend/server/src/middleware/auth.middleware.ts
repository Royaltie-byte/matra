//this middleware , is the one that protexts every page that needs authentication
import  jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { Request, Response , NextFunction } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

dotenv.config();


export const authenticateToken = (req: Request, res: Response, next:NextFunction ) =>{
    //get the authorization header , which has the token
    const authHeader = req.headers.authorization;

    //check if a header was returned and if a valid token exists.
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            message: "Not authenticated."
        })
    }

    //get the token 
    const token = authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({
            success: false,
            message: "Token is missing or malformed."
        })
    }

    const secret = process.env.JWT_SECRET;

    //check that the JWT_SECRET is defined.
    if(!secret){
        throw new Error("JWT secret is not defined.")
    }

    try{
        const decoded = jwt.verify(token,secret);
        //store this jwt payload returned into req.user
        req.user = decoded as JwtPayload & {
            user_id: string;
            organization_id: string;
            role: string;
        };
        console.log("Authenticated.");
        next();
    }catch(error){
        console.error(`Authentication error: ${error}`);
        res.status(401).json({
            success:false,
            message: "Invalid or expired token!"
        })
    }


    
}