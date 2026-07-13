import type { Request, Response } from "express";
import pool from "../config/db.js";
import { registerUser } from "../services/auth.service.js";

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