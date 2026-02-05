import { Request, Response, NextFunction } from "express";
import { studentService } from "../services/student.service";
import { userService } from "../services/user.service";
import { notificationService } from "../services/notification.service";
import { Role } from "@prisma/client";
import { logAction } from "../utils/logger.util";
import { mapStudent } from "../utils/mapper.util";
import { getPaginationParams } from "../utils/pagination.util";
import { UnauthorizedError, BadRequestError } from "../errors/AppError";

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new UnauthorizedError("Nincs azonosítva a felhasználó.");
        }

        const student = await studentService.getProfile(userId);
        res.status(200).json({
            success: true,
            data: mapStudent(student)
        });
    } catch (error) {
        next(error);
    }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const student = await studentService.getProfile(id);

        await logAction(req, {
            action: "VIEW_STUDENT",
            entity: "User",
            entityId: id,
            details: { viewerId: req.user?.userId }
        });

        res.status(200).json({
            success: true,
            data: mapStudent(student)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all students
 * @route GET /api/students
 * @group Students - Student operations
 * @returns {object} 200 - Paginated list of students
 * @security bearerAuth
 */
export const getAllStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await studentService.getAll(params);
        res.status(200).json({
            success: true,
            data: result.data.map(mapStudent),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new UnauthorizedError("Nincs azonosítva.");
        }

        const updated = await studentService.updateProfile(userId, req.body);

        await logAction(req, {
            action: "UPDATE_OWN_PROFILE",
            entity: "User",
            entityId: userId,
            details: { updatedById: userId, updatedFields: Object.keys(req.body) }
        });

        res.json({
            success: true,
            message: "Profilod sikeresen frissítve!",
            data: mapStudent(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const updateStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const updated = await studentService.updateProfile(id, req.body);

        await logAction(req, {
            action: "UPDATE_STUDENT_BY_ADMIN",
            entity: "User",
            entityId: id,
            details: {
                updatedBy: req.user?.userId,
                updatedFields: Object.keys(req.body)
            }
        });

        res.status(200).json({
            success: true,
            message: "Hallgatói adatok sikeresen frissítve.",
            data: mapStudent(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Nincs azonosítva." });
        }

        await studentService.deleteProfile(userId);

        await logAction(req, {
            action: "DELETE_OWN_PROFILE",
            entity: "User",
            entityId: userId,
            details: { reason: "User self-deletion" }
        });

        res.json({ success: true, message: "Profilod sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};

export const deleteStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        await studentService.deleteProfile(id);

        await logAction(req, {
            action: "DELETE_STUDENT_BY_ADMIN",
            entity: "User",
            entityId: id,
            details: { deletedBy: req.user?.userId }
        });

        res.json({ success: true, message: "A hallgatói profil sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};
export const transitionToUniversity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new UnauthorizedError("Nincs azonosítva.");
        }

        const updated = await studentService.transitionToUniversity(userId, req.body);

        await logAction(req, {
            action: "STUDENT_UNIVERSITY_TRANSITION",
            entity: "User",
            entityId: userId,
            details: {
                neptunCode: req.body.neptunCode,
                majorId: req.body.majorId
            }
        });

        res.status(200).json({
            success: true,
            message: "Sikeresen átváltottál egyetemi profilra!",
            data: mapStudent(updated)
        });

        // Értesítés a rendszergazdáknak
        const admins = (await userService.getAllByRole(Role.SYSTEM_ADMIN)) as any[];
        const studentName = (updated as any).fullName || "Hallgató";

        for (const admin of admins) {
            await notificationService.create({
                userId: admin.id,
                title: "Egyetemi profil váltás",
                message: `${studentName} átváltott középiskolai profilról egyetemire (Neptun: ${req.body.neptunCode}).`,
                type: "STUDENT_TRANSITION"
            });
        }
    } catch (error) {
        next(error);
    }
};
