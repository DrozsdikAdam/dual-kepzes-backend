import { Request, Response, NextFunction } from "express";
import { applicationService } from "../services/application.service";
import { notificationService } from "../services/notification.service";
import { logAction } from "../utils/logger.util";
import { mapApplication } from "../utils/mapper.util";
import { getPaginationParams } from "../utils/pagination.util";
import { validateUploadedFiles } from "../utils/file-validation.util";
import prisma from "../config/prisma";
import { ApplicationStatus, Role } from "@prisma/client";
import { mailer } from "../config/mailer";
import { ForbiddenError, NotFoundError } from "../errors/AppError";

export const applyToPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { positionId } = req.body;
        const { userId } = req.user!;

        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            throw new ForbiddenError("Csak hallgatói profillal lehet jelentkezni.");
        }

        const application = await applicationService.apply(studentProfile.id, positionId);

        await logAction(req, {
            action: "APPLY_TO_POSITION",
            entity: "Application",
            entityId: application.id,
            details: { studentId: studentProfile.id, positionId }
        });

        // Értesítések küldése
        await sendNewApplicationNotifications(application);

        res.status(201).json({
            success: true,
            message: "Sikeres jelentkezés",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Segédfüggvény az új jelentkezésről szóló értesítések kiküldéséhez
 */
async function sendNewApplicationNotifications(application: any) {
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
}

export const getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            throw new ForbiddenError("Nincs hallgatói profilod.");
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
            throw new ForbiddenError("Nincs hallgatói profilod.");
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
        res.json({
            success: true,
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const application = await applicationService.update(id, data);
        res.json({
            success: true,
            message: "Jelentkezés frissítve",
            data: mapApplication(application)
        });
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

/**
 * Fájlok fogadása és azonnali továbbítása HR-nek email-ben.
 * GDPR-kompatibilis: a fájlok csak memóriában vannak, nem kerülnek tárolásra.
 */
export const submitApplicationFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { positionId } = req.body;
        const { userId } = req.user!;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files?.cv?.[0]) {
            return res.status(400).json({
                success: false,
                message: "Önéletrajz (CV) csatolása kötelező."
            });
        }

        // Magic bytes validálás
        // A kliens által küldt MIME type hamisítható, ezért a fájl tényleges tartalmát ellenőrizzük
        await validateUploadedFiles(files);

        // Diák adatainak lekérése
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId },
            include: { user: true }
        });

        if (!studentProfile) {
            throw new ForbiddenError("Csak hallgatói profillal lehet jelentkezni.");
        }

        // Pozíció adatainak lekérése
        const position = await prisma.position.findUnique({
            where: { id: positionId },
            include: { company: true }
        });

        if (!position) {
            throw new NotFoundError("Pozíció");
        }

        // Céges adminok email címeinek lekérése
        const companyAdminUsers = await prisma.user.findMany({
            where: {
                role: Role.COMPANY_ADMIN,
                companyEmployee: {
                    companyId: position.company.id
                }
            },
            select: { id: true, email: true }
        });

        if (companyAdminUsers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "A cégnek nincs regisztrált adminisztrátora, akinek továbbíthatnánk a dokumentumokat."
            });
        }

        const adminEmails = companyAdminUsers.map(admin => admin.email);

        const attachments = [
            {
                filename: files.cv[0].originalname,
                content: files.cv[0].buffer
            }
        ];

        if (files.motivationLetter?.[0]) {
            attachments.push({
                filename: files.motivationLetter[0].originalname,
                content: files.motivationLetter[0].buffer
            });
        }

        console.log(`[SUBMIT_FILES] Attachment méretek: CV: ${files.cv[0].size} bytes, Motivation: ${files.motivationLetter?.[0]?.size || 0} bytes`);

        // Jelentkezés létrehozása az adatbázisban (fájlok nélkül)
        const application = await applicationService.apply(studentProfile.id, positionId);

        // Email küldése a céges adminoknak a fájlokkal - HÁTTÉRBEN (nincs await)
        // Megjegyzés: mialatt fut, a response-t már elküldjük.
        mailer.sendMail({
            from: '"Duális Képzés" <no-reply@dualis.hu>',
            to: adminEmails,
            subject: `Új jelentkezés: ${studentProfile.user.fullName} - ${position.title}`,
            text: `
Új jelentkezés érkezett a duális képzésre!

Jelentkező: ${studentProfile.user.fullName}
Email: ${studentProfile.user.email}
Telefon: ${studentProfile.user.phoneNumber}
Pozíció: ${position.title}
Cég: ${position.company.name}

A csatolt dokumentumok:
- CV (önéletrajz)${files.motivationLetter?.[0] ? "\n- Motivációs levél" : ""}
            `,
            attachments
        }).catch((err: any) => {
            console.error(`[BACKGROUND_EMAIL_ERROR] Hiba az email küldése közben (${application.id}):`, err);
        });

        await logAction(req, {
            action: "APPLY_TO_POSITION_WITH_FILES",
            entity: "Application",
            entityId: application.id,
            details: { studentId: studentProfile.id, positionId, filesForwardedToHR: true }
        });

        // Értesítés küldése a céges adminoknak
        await sendNewApplicationNotifications(application);

        // A buffer-ek automatikusan törlődnek a garbage collection által

        res.status(201).json({
            success: true,
            message: "Sikeres jelentkezés! A dokumentumok továbbítva lettek a HR-nek.",
            data: mapApplication(application)
        });
    } catch (error) {
        next(error);
    }
};
