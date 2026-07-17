//requireRole middleware to check routes for selected authorized personell.

import type { Request , Response , NextFunction } from 'express';


export const requireRole = (allowedList: string[]) => {
    return (req: Request , res: Response , next: NextFunction ) => {
        //if block to check if the role is authorized.
        
        if(!req.user || !allowedList.includes(req.user.role)){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action!"
            })
        }

        //if authorized , call the next function.
        next();
    }
}

