import { Pool } from  "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

//logging some information on connection to database

pool.on('connect', () => {
    console.log("Connected to Supabase successfully.")
});

pool.on('error',(err) => {
    console.error("Unexpected DB error",err)

});

export default pool;