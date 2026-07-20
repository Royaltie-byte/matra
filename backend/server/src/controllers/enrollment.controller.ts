import type { Request , Response } from 'express';
import { findMotherById } from '../services/mothers.service.js';
import { insertEnrollment , getEnrollmentsByOrganization , findEnrollmentById , updateEnrollmentById } from '../services/enrollment.service.js';

//========== POST /enrollment route ============//

export const createEnrollment = async (req: Request , res: Response ) => {
    try{
        //collect id from frontend , probably form get /mothers/:id.
        //but first make sure the user was authenticated.
        if (!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            })
        }

        const { mother_id } = req.body;

        if(!mother_id){
            return res.status(400).json({
                success:false,
                message: "All fields are required!"
            })
        }

        //check if mother exists or exists in this organisation.

        const mother = await findMotherById(mother_id,req.user.organization_id);

        if(!mother){
            return res.status(404).json({
                success:false,
                message: "Mother not found!"
            })
        }

        //after all the checks , create the enrollment.

        const organization_id = req.user.organization_id;
        const enrolled_by = req.user.user_id;

        const enrollment = await insertEnrollment({
            mother_id,
            organization_id,
            enrolled_by
            
        });

        return res.status(201).json({
            success:true,
            message: "Enrollment created successfully!",
            data:{
                mother_id: enrollment.mother_id,
                enrollment_id: enrollment.enrollment_id,
                enrolled_by: enrollment.enrolled_by,
                status: enrollment.status,
                expected_end_date: enrollment.expected_end_date,
                created_at: enrollment.created_at

            }
        })

    }catch(error){
        console.error('Enrollment creation error!: ',error);
        return res.status(500).json({
            success:false,
            message: "Failed to create the enrollment!"
        })
    }

}


//========== GET /enrollment route ============//

export const listEnrollments = async (req: Request , res: Response ) => {
    try{
        //make sure the user is authenticated.
        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            })
        }

        //adding a filter to only view ACTIVE enrollments , but as an optional parameter

        const { status } = req.query;

        //so we just go ahead and list everything
        const organization_id = req.user.organization_id;

        const enrollments = await getEnrollmentsByOrganization(organization_id , status as string | undefined);

        return res.status(200).json({
            success:true,
            message:"All enrollments acquired successfully!",
            data:enrollments
        })
    }catch(error){
        console.error("Failed to get enrollments!:",error);
        return res.status(500).json({
            success:false,
            message:"Failed to get enrollments!"
            
        })
    }

}

//=========== GET /enrollment/:id ===== ===//

export const getEnrollment = async ( req: Request , res: Response ) => {
    try{
        //confirm authentication.
        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            });
        }

        const id = req.params.id as string;

        const organization_id = req.user.organization_id;

        //confirm this id exists in this organization.
        const enrollment = await findEnrollmentById(id , organization_id);

        if(!enrollment){
            return res.status(404).json({
                success:false,
                message: "Enrollment not found!"
            })
        }

        return res.status(200).json({
            success:true,
            message:"Enrollment acquired successfully!",
            data:enrollment
        })
    }catch(error){
        console.error("Failed to get enrollment!:",error);
        return res.status(500).json({
            success:false,
            message: "Failed to get enrollement!"
        })
    }

}

//========== PATCH /enrollment/:id ===========//

export const updateEnrollment = async (req: Request , res: Response ) => {
    try{
        //confirm authentication of the one trying the update.

        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            });
        }

        //get the id  and status

        const id = req.params.id as string;

        const { status } = req.body;

    
        //validation.

        const VALID_STATUSES = ['ACTIVE','COMPLETED','WITHDRAWN'];

        if(!status || !VALID_STATUSES.includes(status) ){
            return res.status(400).json({
                success:false,
                message: "A valid status ( ACTIVE , COMPLETED , WITHDRAWN ) is required!"
            })
        }

        //doing the actual update.

        const organization_id = req.user.organization_id;

        const updated_enrollment = await updateEnrollmentById(id,organization_id,status);

        if(!updated_enrollment){
            return res.status(404).json({
                success:false,
                message: "Enrollment not found!"
            })
        }

        return res.status(200).json({
            success:true,
            message: "Enrollment updated successfully!",
            data: updated_enrollment
        })

    }catch(error){
        console.error('Enrollment update failed!: ',error);
        return res.status(500).json({
            success:false,
            message: "Enrollment update failed!"
        })
    }
}