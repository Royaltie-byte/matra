import pool from "./config/db.js";

// testing if the database has been connected .
//temporary code ...

async function main() {
    try {
        const result = await pool.query(
            "SELECT * FROM organization"
        );

        console.log(result.rows);

    } catch (err) {
        console.error("Database error:", err);
    }
}

main();