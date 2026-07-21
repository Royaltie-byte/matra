import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";
import { createDelivery, getDelivery, updateDelivery } from "../controllers/delivery.controller.js";

const router = Router();

// Mount this router at the same base path as enrollment.routes.ts
// (e.g. app.use('/enrollments', enrollmentRoutes); app.use('/enrollments', deliveryRoutes);)
// so these resolve as /enrollments/:id/delivery.

router.post(
    "/:id/delivery",
    authenticateToken,
    requireRole(["NURSE", "DOCTOR"]),
    createDelivery
);

router.get(
    "/:id/delivery",
    authenticateToken,
    requireRole(["NURSE", "DOCTOR", "HOSPITAL_ADMIN"]),
    getDelivery
);

router.patch(
    "/:id/delivery",
    authenticateToken,
    requireRole(["NURSE", "DOCTOR"]),
    updateDelivery
);

export default router;
