import { Router } from "express";
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.middleware.js'

import {
    login,
    logout,
    me,
    register,
    invite
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me",authenticateToken, me);

//invite functionality 
//currently set that only the super admin can invite staff( doctor , nurse , chw etc)
router.post("/invite",authenticateToken,requireRole(['SUPER_ADMIN']),invite);

export default router;