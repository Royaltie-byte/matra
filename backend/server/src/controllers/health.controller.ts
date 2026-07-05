//importing types as required by typescript 
import type  { Request , Response } from 'express';

//creating a function expression for the health route

export const getHealth = (req: Request , res: Response ) => {
    res.status(200).json({
        status: "OK",
        message: "Server is Healthy!"
    });
}
