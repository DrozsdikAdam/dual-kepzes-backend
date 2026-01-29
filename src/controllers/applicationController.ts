import { Request, Response, NextFunction } from "express";
import { applicationService } from "../services/application.service";
import { notificationService } from "../services/notification.service";
import { logAction } from "../utils/logger";
import { mapApplication } from "../utils/mappers";
import { getPaginationParams } from "../utils/pagination";
import prisma from "../config/prisma";
import { ApplicationStatus, Role } from "@prisma/client";

export const applyToPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { positionId, studentNote } = req.body;
        const { userId } = req.user!;

        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            return res.status(403).json({ message: "Csak hallgatói profillal lehet jelentkezni." });
        }

        const application = await applicationService.apply(studentProfile.id, positionId, studentNote);

        await logAction(req, {
            action: "APPLY_TO_POSITION",
            entity: "Application",
            entityId: application.id,
            details: { studentId: studentProfile.id, positionId }
        });

        // Értesítés küldése a céges adminnak az új jelentkezésről
        const companyAdmins = await prisma.user.findMany({
            where: {
                role: Role.COMPANY_ADMIN,
                companyEmployee: {
                    companyId: application.position.company.id
                }
            },
            select: { id: true }
        });

        for (const admin of companyAdmins) {
            await notificationService.create({
                userId: admin.id,
                title: "Új jelentkezés érkezett",
                message: `Új jelentkezés érkezett a(z) ${application.position.title ?? 'pozíció'} pozícióra: ${application.student.user.fullName}`,
                type: "NEW_APPLICATION"
            });
        }

        res.status(201).json({
            success: true,
            message: "Sikeres jelentkezés",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};

export const getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            return res.status(403).json({ message: "Nincs hallgatói profilod." });
        }

        const params = getPaginationParams(req.query);
        const result = await applicationService.getMyApplications(studentProfile.id, params);
        res.json({
            success: true,
            data: result.data.map(mapApplication),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const retractApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            return res.status(403).json({ message: "Nincs hallgatói profilod." });
        }

        const application = await applicationService.retract(id, studentProfile.id);

        await logAction(req, {
            action: "RETRACT_APPLICATION",
            entity: "Application",
            entityId: id,
            details: { studentId: studentProfile.id }
        });

        res.json({
            success: true,
            message: "Jelentkezés visszavonva",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await applicationService.getAll(params);
        res.json({
            success: true,
            data: result.data.map(mapApplication),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const getApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const application = await applicationService.getById(id);
        res.json(mapApplication(application));
    } catch (error) {
        next(error);
    }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const application = await applicationService.update(id, data);
        res.json(mapApplication(application));
    } catch (error) {
        next(error);
    }
};

export const evaluateApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, companyNote } = req.body;
        const { userId } = req.user!;

        const application = await applicationService.evaluate(id, userId, status, companyNote);

        await logAction(req, {
            action: "EVALUATE_APPLICATION",
            entity: "Application",
            entityId: id,
            details: { status, evaluatedBy: userId }
        });

        // Értesítés küldése a diáknak a státuszváltozásról
        const statusMessages: Record<ApplicationStatus, { title: string; type: string }> = {
            [ApplicationStatus.ACCEPTED]: { title: "Jelentkezésed elfogadva!", type: "APPLICATION_ACCEPTED" },
            [ApplicationStatus.REJECTED]: { title: "Jelentkezésed elutasítva", type: "APPLICATION_REJECTED" },
            [ApplicationStatus.NO_RESPONSE]: { title: "Jelentkezésedre nem érkezett válasz.", type: "APPLICATION_NO_RESPONSE" },
            [ApplicationStatus.SUBMITTED]: { title: "Jelentkezésed beérkezett", type: "APPLICATION_SUBMITTED" },
            [ApplicationStatus.RETRACTED]: { title: "Jelentkezésed visszavonva", type: "APPLICATION_RETRACTED" }
        };

        const statusInfo = statusMessages[status as ApplicationStatus];
        if (statusInfo) {
            await notificationService.create({
                userId: application.student.userId,
                title: statusInfo.title,
                message: `A(z) ${application.position.company.name} cégnél a(z) ${application.position.title ?? 'pozíció'} pozícióra beadott jelentkezésed státusza: ${status}`,
                type: statusInfo.type
            });
        }

        res.json({
            success: true,
            message: "Sikeres értékelés",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};

export const getMyCompanyApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const params = getPaginationParams(req.query);
        const result = await applicationService.getCompanyApplications(userId, params);
        res.json({
            success: true,
            data: result.data.map(mapApplication),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const updateEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    // This could also use evaluation logic
    try {
        const { id } = req.params;
        const { status, companyNote } = req.body;
        const { userId } = req.user!;

        const application = await applicationService.evaluate(id, userId, status, companyNote);

        res.json({
            success: true,
            message: "Értékelés frissítve",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};
