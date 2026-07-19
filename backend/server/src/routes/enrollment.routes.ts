import { Router } from 'express';
import  { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.middleware.js';
import { createEnrollment , listEnrollments , getEnrollment , updateEnrollment } from '../controllers/enrollment.controller.js'

const router = Router();

//routes under enrollment.

router.post(
    '/',
    authenticateToken,
    requireRole(['NURSE','HOSPITAL_ADMIN']),
    createEnrollment
);

router.get(
    '/',
    authenticateToken,
    requireRole(['SUPER_ADMIN','HOSPITAL_ADMIN','NURSE','DOCTOR']),
    listEnrollments
);


router.get(
    '/:id',
    authenticateToken,
    requireRole(["NURSE", "DOCTOR", "HOSPITAL_ADMIN"]),
    getEnrollment
);

//for updating a particular enrollment.

router.patch(
    '/:id',
    authenticateToken,
    requireRole(['NURSE','DOCTOR','HOSPITAL_ADMIN']),
    updateEnrollment
);

/*
    For future reference , the note on a CHW or NURSE being able to view their 
    enrollments , we will add the route below in this file,post - MVP

    router.get('/mine',authenticateToken,getMyEnrollments)

    
 */

export default router;