import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";
import { registerMother, listMothers, getMother, updateMotherController } from "../controllers/mothers.controller.js";

const router = Router();

// POST /mothers - register a mother (pre-enrollment identity record)
router.post(
    "/",
    authenticateToken,
    requireRole(["NURSE", "HOSPITAL_ADMIN"]),
    registerMother
);

// GET /mothers - list mothers in org (any authenticated org staff)
//made this accessible to everyone
router.get("/", authenticateToken, requireRole(["SUPER_ADMIN", "HOSPITAL_ADMIN","DOCTOR","NURSE"]), listMothers);

// GET /mothers/:id - full mother profile (any authenticated org staff)
router.get("/:id", authenticateToken,requireRole(["NURSE", "DOCTOR", "HOSPITAL_ADMIN"]), getMother);

// PATCH /mothers/:id - update identity/contact info
router.patch(
    "/:id",
    authenticateToken,
    requireRole(["NURSE", "DOCTOR", "HOSPITAL_ADMIN"]),
    updateMotherController
);

export default router;