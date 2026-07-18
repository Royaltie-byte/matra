import type { Request, Response } from "express";
import { createMother, findMothersByOrganization, findMotherById, findMotherByPhone, findMotherByEmail, updateMother } from "../services/mothers.service.js";
import { isValidEmail, isValidPhone } from "../utils/validation.js";

//============ POST /mothers - register a mother ============//

export const registerMother = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated!" 
            });
        }

        const {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            national_id,
            next_of_kin_name,
            next_of_kin_phone,
        } = req.body;

        if (!first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: "first_name, last_name and phone are required.",
            });
        }

        if (!isValidPhone(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid phone number." 
            });
        }

        if (email && !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email." 
            });
        }

        // organization_id always comes from the authenticated user's token,
        // never from the request body - this is the org-scoping rule from
        // the blueprint (Section 5a), applied on the write path too.
        const organization_id = req.user.organization_id;

        const existingPhone = await findMotherByPhone(phone, organization_id);
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "A mother with this phone number already exists in your organization.",
            });
        }

        if (email) {
            const existingEmail = await findMotherByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: "A mother with this email already exists.",
                });
            }
        }

        const mother = await createMother(organization_id, {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            national_id,
            next_of_kin_name,
            next_of_kin_phone,
        });

        return res.status(201).json({
            success: true,
            message: "Mother registered successfully.",
            data: mother,
        });
    } catch (error) {
        console.error("Register mother error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to register mother." 
        });
    }
};

//============ GET /mothers - list mothers in own org ============//

export const listMothers = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated!" 
            });
        }

        // business rules dictate that CHW should only see mothers assigned to them.
        // There's no assignment relation on `mother` yet (it'll likely live
        // on `enrollment` or a join table) - once that exists, branch here
        // on req.user.role === 'CHW' and filter accordingly.
        const mothers = await findMothersByOrganization(req.user.organization_id);

        return res.status(200).json({
            success: true,
            data: mothers,
        });
    } catch (error) {
        console.error("List mothers error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch mothers." 
        });
    }
};

//============ GET /mothers/:id - single mother profile ============//

export const getMother = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated!" 
            });
        }

        const id = req.params.id as string;

        const mother = await findMotherById(id, req.user.organization_id);

        if (!mother) {
            // Same 404 whether the mother doesn't exist OR belongs to another
            // org - never leak "it exists, just not in your org."
            return res.status(404).json({ 
                success: false, 
                message: "Mother not found." 
            });
        }

        return res.status(200).json({ success: true, data: mother });
    } catch (error) {
        console.error("Get mother error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch mother." 
        });
    }
};

//============ PATCH /mothers/:id - update identity/contact info ============//

export const updateMotherController = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated!" 
            });
        }

        const id = req.params.id as string;
        const {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            national_id,
            next_of_kin_name,
            next_of_kin_phone,
        } = req.body;

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid phone number." 
            });
        }

        if (email && !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email." 
            });
        }

        const organization_id = req.user.organization_id;

        // Confirm the mother exists in THIS org before doing anything else -
        // this also feeds the "did phone/email actually change" checks below.
        const existing = await findMotherById(id, organization_id);
        if (!existing) {
            return res.status(404).json({ 
                success: false, 
                message: "Mother not found." 
            });
        }

        if (phone && phone.trim() !== existing.phone) {
            const phoneOwner = await findMotherByPhone(phone, organization_id);
            if (phoneOwner && phoneOwner.mother_id !== id) {
                return res.status(409).json({
                    success: false,
                    message: "A mother with this phone number already exists in your organization.",
                });
            }
        }

        if (email && email.toLowerCase().trim() !== existing.email) {
            const emailOwner = await findMotherByEmail(email);
            if (emailOwner && emailOwner.mother_id !== id) {
                return res.status(409).json({
                    success: false,
                    message: "A mother with this email already exists.",
                });
            }
        }

        const updated = await updateMother(id, organization_id, {
            first_name,
            last_name,
            phone,
            email,
            date_of_birth,
            national_id,
            next_of_kin_name,
            next_of_kin_phone,
        });

        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided to update." 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Mother updated successfully.",
            data: updated,
        });
    } catch (error) {
        console.error("Update mother error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to update mother." 
        });
    }
};