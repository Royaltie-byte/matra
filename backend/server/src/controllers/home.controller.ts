// route layer response logic

import type { Request, Response } from "express";

export const getHome = (req: Request, res: Response) => {
    res.status(200).json({
        status: "running",
        message: "Matra API is operational",
    });
}