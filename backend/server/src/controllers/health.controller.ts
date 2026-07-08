//importing types as required by typescript 
import type  { Request , Response } from 'express';

//importing the postgresql database pool
import pool from "../config/db.js";

//creating an asynchronous function expression for the health route

export const getHealth = async (req: Request, res: Response) => {
    try {
        await pool.query("SELECT NOW()");

        res.status(200).json({
            status: "OK",
            message: "Server is healthy!",
            database: "Connected",
        });
    } catch (error) {
        console.error("Health check failed:", error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed.",
            database: "Disconnected",
        });
    }
};