import { Request, Response, NextFunction } from "express";
import { partnershipService } from "../services/partnership.service";
import { notificationService } from "../services/notification.service";
import { notifySystemAdmins } from "../utils/notification.util";
import { NOTIFICATION_TYPES } from "../utils/constants";
import { Role, PartnershipStatus } from "@prisma/client";
import { DualPartnershipUpdateRequest } from "../schemas/dual.schema";
import { logAction } from "../utils/logger.util";
import { mapDualPartnership } from "../utils/mapper.util";
import { getPaginationParams } from "../utils/pagination.util";
import { getCurrentSemester } from "../utils/semester.util";

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


        res.json({
            success: true,
            message: "Partneri kapcsolat megszakítva.",
            data: mapDualPartnership(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const completePartnership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const updated = await partnershipService.complete(id, userId);

        await logAction(req, {
            action: "COMPLETE_DUAL_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { completedBy: userId }
        });


        res.json({
            success: true,
            message: "Partneri kapcsolat befejezve.",
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
        const { userId } = req.user!;
        const params = getPaginationParams(req.query);
        const result = await partnershipService.getUniversityPartnerships(userId, params);
        res.json({
            success: true,
            data: result.data.map(mapDualPartnership),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};
