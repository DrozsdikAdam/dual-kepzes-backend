import { Request, Response, NextFunction } from "express";
import { partnershipService } from "../services/partnership.service";
import { notificationService } from "../services/notification.service";
import { userService } from "../services/user.service";
import { Role, PartnershipStatus } from "@prisma/client";
import { DualPartnershipUpdateRequest } from "../schemas/dualSchema";
import { logAction } from "../utils/logger";
import { mapDualPartnership } from "../utils/mappers";
import { getPaginationParams } from "../utils/pagination";

export const getPartnershipById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const partnership = await partnershipService.getById(id, userId);

        res.json({
            success: true,
            data: mapDualPartnership(partnership)
        });
    } catch (error) {
        next(error);
    }
};

export const updatePartnership = async (
    req: Request<DualPartnershipUpdateRequest['params'], {}, DualPartnershipUpdateRequest['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const { userId } = req.user!;

        const updated = await partnershipService.update(id, userId, data);

        await logAction(req, {
            action: "UPDATE_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { updatedById: userId, changedFields: Object.keys(data) }
        });

        if (data.status) {
            await notificationService.create({
                userId: updated.student.userId,
                title: "Partnerség státusza megváltozott",
                message: `A(z) ${updated.position?.company.name || "érintett"} céggel kötött partnerséged státusza megváltozott: ${data.status}`,
                type: "PARTNERSHIP_STATUS_UPDATE"
            });

            if (data.status === PartnershipStatus.PENDING_UNIVERSITY) {
                const universityUsers = await userService.getAllByRole(Role.UNIVERSITY_USER) as any[];
                for (const uniUser of universityUsers) {
                    await notificationService.create({
                        userId: uniUser.id,
                        title: "Új jóváhagyásra váró partnerség",
                        message: `Új duális partnerség vár egyetemi jóváhagyásra: ${updated.student.user.fullName} - ${updated.position?.company.name || "Ismeretlen cég"}`,
                        type: "PARTNERSHIP_PENDING_UNIVERSITY"
                    });
                }
            }
        }

        if (data.mentorId && updated.mentor) {
            await notificationService.create({
                userId: updated.mentor.userId,
                title: "Új hallgató hozzárendelve",
                message: `Új hallgatót rendeltek hozzád mentorálásra: ${updated.student.user.fullName}`,
                type: "STUDENT_ASSIGNED_TO_MENTOR"
            });
        }

        res.json({
            success: true,
            message: "Partnerség adatai sikeresen frissítve",
            data: mapDualPartnership(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const deletePartnership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        await partnershipService.delete(id, userId);

        await logAction(req, {
            action: "DELETE_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { deletedById: userId }
        });

        res.json({ success: true, message: "Partnerség sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};

export const terminatePartnership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const updated = await partnershipService.terminate(id, userId);

        await logAction(req, {
            action: "TERMINATE_DUAL_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { terminatedBy: userId }
        });

        await notificationService.create({
            userId: updated.student.userId,
            title: "Partnerség megszakítva",
            message: `A(z) ${updated.position?.company.name || "érintett"} céggel kötött partnerséged megszakításra került.`,
            type: "PARTNERSHIP_TERMINATED"
        });

        res.json({
            success: true,
            message: "Partneri kapcsolat megszakítva.",
            data: mapDualPartnership(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const assignMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;
        const { userId } = req.user!;

        const updated = await partnershipService.assignMentor(id, mentorId, userId);

        await logAction(req, {
            action: "ASSIGN_MENTOR",
            entity: "DualPartnership",
            entityId: id,
            details: { assignedMentorId: mentorId, assignedBy: userId }
        });

        await notificationService.create({
            userId: updated.student.userId,
            title: "Mentor hozzárendelve",
            message: `A(z) ${updated.position?.company.name || "érintett"} cégnél kijelöltek számodra egy mentort. A partnerség mostantól az egyetemi jóváhagyásra vár.`,
            type: "MENTOR_ASSIGNED"
        });

        // Notify university users as well
        const universityUsers = await userService.getAllByRole(Role.UNIVERSITY_USER) as any[];
        for (const uniUser of universityUsers) {
            await notificationService.create({
                userId: uniUser.id,
                title: "Új jóváhagyásra váró partnerség",
                message: `Új duális partnerség vár egyetemi jóváhagyásra: ${updated.student.user.fullName} - ${updated.position?.company.name || "Ismeretlen cég"}`,
                type: "PARTNERSHIP_PENDING_UNIVERSITY"
            });
        }

        // Notify assigned mentor
        if (updated.mentor) {
            await notificationService.create({
                userId: updated.mentor.userId,
                title: "Új hallgató hozzárendelve",
                message: `Új hallgatót rendeltek hozzád mentorálásra: ${updated.student.user.fullName}`,
                type: "STUDENT_ASSIGNED_TO_MENTOR"
            });
        }

        res.json({
            success: true,
            data: mapDualPartnership(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const assignUniversityUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { uniEmployeeId } = req.body;
        const { userId } = req.user!;

        const updated = await partnershipService.assignUniversityUser(id, uniEmployeeId, userId);

        await logAction(req, {
            action: "ASSIGN_UNI_USER",
            entity: "DualPartnership",
            entityId: id,
            details: { assignedUniUserId: uniEmployeeId, assignedBy: userId }
        });

        await notificationService.create({
            userId: updated.student.userId,
            title: "Egyetemi felelős hozzárendelve",
            message: `A(z) ${updated.position?.company.name || "érintett"} céggel kötött partnerségedhez hozzárendelték az egyetemi felelőst. A partnerség aktívvá vált.`,
            type: "UNI_USER_ASSIGNED"
        });

        res.json({
            success: true,
            data: mapDualPartnership(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const getStudentPartnerships = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const params = getPaginationParams(req.query);
        const result = await partnershipService.getStudentPartnerships(userId, params);
        res.json({
            success: true,
            data: result.data.map(mapDualPartnership),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const getCompanyPartnerships = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const params = getPaginationParams(req.query);
        const result = await partnershipService.getCompanyPartnerships(userId, params);
        res.json({
            success: true,
            data: result.data.map(mapDualPartnership),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const getUniversityPartnerships = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await partnershipService.getUniversityPartnerships(params);
        res.json({
            success: true,
            data: result.data.map(mapDualPartnership),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};
