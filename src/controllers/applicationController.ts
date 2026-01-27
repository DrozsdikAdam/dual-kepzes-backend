import { Request, Response, NextFunction } from "express";
import { applicationService } from "../services/application.service";
import { logAction } from "../utils/logger";
import { mapApplication } from "../utils/mappers";
import prisma from "../config/prisma";

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

        const applications = await applicationService.getMyApplications(studentProfile.id);
        res.json(applications.map(mapApplication));
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
        // This could be admin only, but currently used for system admins
        const applications = await prisma.application.findMany({
            include: {
                student: { include: { user: true } },
                position: { include: { company: true } }
            }
        });
        res.json(applications.map(mapApplication));
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
        const applications = await applicationService.getCompanyApplications(userId);
        res.json(applications.map(mapApplication));
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
