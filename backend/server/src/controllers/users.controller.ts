import type { Request , Response } from 'express';


export const getUsers = async (req: Request , res: Response ) => {
    res.status(501).json({
        success:false,
        message: "Not implemented yet."
    })
}


//not sure if this one needs to be async.
export const inviteUsers = async (req: Request , res: Response ) => {
    res.status(501).json({
        success:false,
        message: "Not implemented yet."
    })
}