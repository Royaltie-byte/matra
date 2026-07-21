import type { Request, Response } from "express";
import { findEnrollmentById } from "../services/enrollment.service.js";
import { createDeliveryRecord, findDeliveryByEnrollmentId, updateDeliveryRecord } from "../services/delivery.service.js";

const VALID_DELIVERY_TYPES = ["NORMAL", "CAESARIAN", "VACUUM", "FORCEPS"];
const VALID_BIRTH_OUTCOMES = ["LIVE_BIRTH", "STILL_BIRTH"];
const VALID_PLACENTA_TYPES = ["NORMAL", "MANUAL", "RETAINED"];

//========== POST /enrollments/:id/delivery ==========//

export const createDelivery = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authenticated!" 
            });
        }

        const enrollment_id = req.params.id as string;
        const organization_id = req.user.organization_id;

        // Confirm this enrollment exists and belongs to the caller's org
        // before touching delivery at all - delivery has no org column of
        // its own, so this is the only place that scoping is enforced.
        const enrollment = await findEnrollmentById(enrollment_id, organization_id);

        if (!enrollment) {
            return res.status(404).json({ 
                success: false, 
                message: "Enrollment not found!" 
            });
        }

        const {
            delivery_date,
            delivery_type,
            gestational_age_weeks,
            birth_outcome,
            birth_weight_grams,
            blood_loss_ml,
            placenta_delivery,
            complications,
            existing_conditions,
        } = req.body;

        if (!delivery_date || !delivery_type || !birth_outcome) {
            return res.status(400).json({
                success: false,
                message: "delivery_date, delivery_type and birth_outcome are required.",
            });
        }

        if (!VALID_DELIVERY_TYPES.includes(delivery_type)) {
            return res.status(400).json({
                success: false,
                message: `delivery_type must be one of: ${VALID_DELIVERY_TYPES.join(", ")}`,
            });
        }

        if (!VALID_BIRTH_OUTCOMES.includes(birth_outcome)) {
            return res.status(400).json({
                success: false,
                message: `birth_outcome must be one of: ${VALID_BIRTH_OUTCOMES.join(", ")}`,
            });
        }

        if (placenta_delivery && !VALID_PLACENTA_TYPES.includes(placenta_delivery)) {
            return res.status(400).json({
                success: false,
                message: `placenta_delivery must be one of: ${VALID_PLACENTA_TYPES.join(", ")}`,
            });
        }

        // Blueprint says one delivery record per enrollment - the DB schema
        // doesn't enforce this with a UNIQUE constraint, so we check here.
        const existingDelivery = await findDeliveryByEnrollmentId(enrollment_id);
        if (existingDelivery) {
            return res.status(409).json({
                success: false,
                message: "A delivery record already exists for this enrollment.",
            });
        }

        const delivery = await createDeliveryRecord(enrollment_id, {
            delivery_date,
            delivery_type,
            gestational_age_weeks,
            birth_outcome,
            birth_weight_grams,
            blood_loss_ml,
            placenta_delivery,
            complications,
            existing_conditions,
        });

        return res.status(201).json({
            success: true,
            message: "Delivery record created successfully!",
            data: delivery,
        });
    } catch (error) {
        console.error("Delivery creation error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to create delivery record." 
        });
    }
};

//========== GET /enrollments/:id/delivery ==========//

export const getDelivery = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authenticated!" 
            });
        }

        const enrollment_id = req.params.id as string;
        const organization_id = req.user.organization_id;

        const enrollment = await findEnrollmentById(enrollment_id, organization_id);
        if (!enrollment) {
            return res.status(404).json({ 
                success: false, 
                message: "Enrollment not found!" 
            });
        }

        const delivery = await findDeliveryByEnrollmentId(enrollment_id);
        if (!delivery) {
            return res.status(404).json({ 
                success: false, 
                message: "Delivery record not found for this enrollment."
            });
        }

        return res.status(200).json({ success: true, data: delivery });
    } catch (error) {
        console.error("Get delivery error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch delivery record." 
        });
    }
};

//========== PATCH /enrollments/:id/delivery ==========//

export const updateDelivery = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authenticated!" 
            });
        }

        const enrollment_id = req.params.id as string;
        const organization_id = req.user.organization_id;

        const enrollment = await findEnrollmentById(enrollment_id, organization_id);
        if (!enrollment) {
            return res.status(404).json({ 
                success: false, 
                message: "Enrollment not found!" 
            });
        }

        const existingDelivery = await findDeliveryByEnrollmentId(enrollment_id);
        if (!existingDelivery) {
            return res.status(404).json({ 
                success: false, 
                message: "Delivery record not found for this enrollment." 
            });
        }

        const {
            delivery_date,
            delivery_type,
            gestational_age_weeks,
            birth_outcome,
            birth_weight_grams,
            blood_loss_ml,
            placenta_delivery,
            complications,
            existing_conditions,
        } = req.body;

        if (delivery_type && !VALID_DELIVERY_TYPES.includes(delivery_type)) {
            return res.status(400).json({
                success: false,
                message: `delivery_type must be one of: ${VALID_DELIVERY_TYPES.join(", ")}`,
            });
        }

        if (birth_outcome && !VALID_BIRTH_OUTCOMES.includes(birth_outcome)) {
            return res.status(400).json({
                success: false,
                message: `birth_outcome must be one of: ${VALID_BIRTH_OUTCOMES.join(", ")}`,
            });
        }

        if (placenta_delivery && !VALID_PLACENTA_TYPES.includes(placenta_delivery)) {
            return res.status(400).json({
                success: false,
                message: `placenta_delivery must be one of: ${VALID_PLACENTA_TYPES.join(", ")}`,
            });
        }

        const updated = await updateDeliveryRecord(enrollment_id, {
            delivery_date,
            delivery_type,
            gestational_age_weeks,
            birth_outcome,
            birth_weight_grams,
            blood_loss_ml,
            placenta_delivery,
            complications,
            existing_conditions,
        });

        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided to update." 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Delivery record updated successfully!",
            data: updated,
        });
    } catch (error) {
        console.error("Delivery update error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to update delivery record." 
        });
    }
};