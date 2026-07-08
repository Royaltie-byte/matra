import type { Request, Response } from "express";

export function register(req: Request, res: Response): void {
    res.status(501).json({
        message: "Register endpoint not implemented yet.",
    });
}

export function login(req: Request, res: Response): void {
    res.status(501).json({
        message: "Login endpoint not implemented yet.",
    });
}

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