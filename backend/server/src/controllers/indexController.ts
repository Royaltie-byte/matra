// route layer response logic

import type { Request, Response } from "express";

export function getHome(req: Request, res: Response): void {
    res.status(200).json({
        status: "running",
        message: "Matra API is operational",
    });
}