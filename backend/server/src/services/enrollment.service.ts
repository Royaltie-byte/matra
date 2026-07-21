import  pool  from '../config/db.js';

interface CreateEnrollmentData {
    mother_id: string;
    organization_id: string;
    enrolled_by: string;
}


//=======creating the enrollment=========//

export const insertEnrollment = async ( mother: CreateEnrollmentData ) => {

    const result = await pool.query(
        `INSERT INTO enrollment (
            mother_id,
            organization_id,
            enrolled_by
            )
            VALUES($1,$2,$3)
            RETURNING 
                enrollment_id,
                mother_id,
                organization_id,
                enrolled_by,
                expected_end_date,
                status,
                created_at`,
                [
                    mother.mother_id,
                    mother.organization_id,
                    mother.enrolled_by
                ]
    );

    return result.rows[0]
}


//============listing all the enrollments========//

export const getEnrollmentsByOrganization = async (organization_id: string , status?: string) => {
    //if status is present

    if(status){
        const result = await pool.query(
            `SELECT * FROM enrollment
             WHERE organization_id = $1 AND status = $2
             ORDER BY created_at DESC`,
             [organization_id,status]
        )

        return result.rows;
    }

    //if no status argument.

    const result = await pool.query(
        `SELECT * FROM enrollment
         WHERE organization_id = $1 
         ORDER BY created_at DESC`,
         [
            organization_id
         ]
    );

    return result.rows;
}


//===========finding a single enrollment===========//

export const findEnrollmentById = async (enrollment_id: string , organization_id: string) => {
    const result = await pool.query(
        `SELECT * FROM enrollment
         WHERE enrollment_id = $1 AND organization_id = $2`,
         [
            enrollment_id,
            organization_id
         ]
    );

    return result.rows[0];
}



//=========== router.patch enrollment ======================//

export const updateEnrollmentById = async (enrollment_id: string , organization_id: string , status: string ) => {

    const result = await pool.query(
        `UPDATE enrollment 
         SET status = $1 , updated_at = NOW()
         WHERE enrollment_id = $2 AND organization_id = $3
         RETURNING 
            enrollment_id,
            mother_id,
            organization_id,
            enrolled_by,
            expected_end_date,
            status,
            created_at , 
            updated_at`,
            [
                status,
                enrollment_id,
                organization_id
            ]
    );

    return result.rows[0];
}