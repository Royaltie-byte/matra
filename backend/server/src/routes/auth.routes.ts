import { Router } from "express";
import { authenticateToken } from '../middleware/auth.middleware.js';

import {
    login,
    logout,
    me,
    register,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me",authenticateToken, me);

export default router;