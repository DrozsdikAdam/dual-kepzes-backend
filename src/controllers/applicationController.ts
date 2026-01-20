import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";
import { ApplicationStatus } from "@prisma/client";
import { mapApplication } from "../utils/mappers";

const applicationSelect = {
    id: true,
    status: true,
    studentNote: true,
    companyNote: true,
    submittedAt: true,
    position: {
        select: {
            id: true,
            title: true,
            deadline: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true
                }
            }
        }
    }
}

const companyApplicationSelect = {
    id: true,
    status: true,
    studentNote: true,
    companyNote: true,
    submittedAt: true,
    position: {
        select: {
            id: true,
            title: true,
            deadline: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true
                }
            }
        }
    },
    student: {
        select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            studentProfile: {
                select: {
                    id: true,
                    mothersName: true,
                    birthDate: true,
                    locations: {
                        select: {
                            country: true,
                            zipCode: true,
                            city: true,
                            address: true
                        }
                    },
                    highSchool: true,
                    graduationYear: true,
                    neptunCode: true,
                    currentMajor: true,
                    studyMode: true,
                    hasLanguageCert: true
                }
            }
        }
    }
}



//hallgatói

export const applyToPosition = async (req: Request, res: Response) => {
    const { positionId, studentNote } = req.body;
    const userId = req.user!.userId;

    try {
        const studentProfile = await prisma.studentProfile.findFirst({
            where: { userId },
            select: { id: true }
        })

        if (!studentProfile) {
            return res.status(403).json({ message: "Csak hallgatói profillal jelentkezhet." })
        }

        const position = await prisma.position.findFirst({
            where: { id: positionId },
            select: { id: true, title: true, isActive: true, deadline: true, company: { select: { id: true, name: true } } }
        })

        if (!position || !position.isActive) {
            return res.status(404).json({ message: "A pozíció nem elérhető." })
        }

        if (position.deadline && new Date() > position.deadline) {
            return res.status(400).json({ message: "A jelentkezési határidő lejárt." })
        }

        const application = await prisma.application.create({
            data: {
                studentId: studentProfile.id,
                positionId: positionId,
                studentNote: studentNote
            },
            select: applicationSelect
        })

        await logAction(req, {
            action: "SUBMIT_APPLICATION",
            entity: "Application",
            entityId: application.id,
            details: {
                position: position.title,
                company: position.company.name,
                studentId: studentProfile.id
            }
        })

        return res.status(201).json({ message: "Sikeres jelentkezés.", application })
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Már jelentkezett erre a pozícióra." })
        }
        return res.status(500).json({ message: "Hiba történt a jelentkezés során." })
    }

}

export const getMyApplications = async (req: Request, res: Response) => {
    try {
        const studentProfile = await prisma.studentProfile.findFirst({
            where: { userId: req.user!.userId },
            select: { id: true }
        })

        if (!studentProfile) return res.status(404).json({ message: "Hallgatói profil szükséges." })

        const applications = await prisma.application.findMany({
            where: { studentId: studentProfile.id },
            select: applicationSelect,
            orderBy: { submittedAt: "desc" }
        })

        return res.json(applications)

    } catch (error) {
        return res.status(500).json({ message: "Hiba a lekérdezés során." })
    }
}

export const retractApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    try {
        const studentProfile = await prisma.studentProfile.findFirst({
            where: { userId },
            select: { id: true }
        })

        if (!studentProfile) {
            return res.status(403).json({ message: "Csak hallgatói profillal vonható vissza jelentkezés." })
        }

        const application = await prisma.application.findFirst({
            where: { id, studentId: studentProfile.id },
            select: applicationSelect
        })

        if (!application) return res.status(404).json({ message: "Nem található jelentkezés vagy nincs jogosultsága." })

        if (application.status !== ApplicationStatus.SUBMITTED) return res.status(400).json({ message: "Csak beadott jelentkezéseket lehet visszavonni." })

        if (application.position.deadline && new Date() > application.position.deadline) {
            return res.status(400).json({ message: "A jelentkezési határidő lejárt, már nem vonható vissza." })
        }

        const retractedApplication = await prisma.application.update({
            where: { id },
            data: {
                status: ApplicationStatus.RETRACTED
            }
        })

        await logAction(req, {
            action: "RETRACTED_APPLICATION",
            entity: "Application",
            entityId: application.id,
            details: {
                position: application.position.title,
                company: application.position.company.name,
                studentId: studentProfile.id
            }
        })

        return res.json(retractedApplication)
    } catch (error) {
        return res.status(500).json({ message: "Hiba a visszavonás során." })
    }
}

// System admin

export const getApplications = async (req: Request, res: Response) => {
    try {
        const applications = await prisma.application.findMany({
            select: companyApplicationSelect,
            orderBy: { submittedAt: "desc" }
        })

        return res.json(applications.map(mapApplication))
    } catch (error) {
        return res.status(500).json({ message: "Hiba a lekérdezés során." })
    }
}

export const getApplication = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const application = await prisma.application.findFirst({
            where: { id },
            select: companyApplicationSelect
        })

        if (!application) return res.status(404).json({ message: "Nem található jelentkezés." })

        return res.json(mapApplication(application))
    } catch (error) {
        return res.status(500).json({ message: "Hiba a lekérdezés során." })
    }
}

export const updateApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, companyNote } = req.body;

    try {
        const application = await prisma.application.update({
            where: { id },
            data: {
                status,
                companyNote,
            }
        })

        return res.json(application)
    } catch (error) {
        return res.status(500).json({ message: "Hiba a módosítás során." })
    }
}

//céges

export const evaluateApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, companyNote } = req.body;
    const userId = req.user!.userId;

    try {
        const employee = await prisma.companyEmployee.findFirst({
            where: { userId, deletedAt: null }
        });

        if (!employee) {
            return res.status(403).json({ message: "Nincs céges jogosultsága." });
        }

        const application = await prisma.application.findFirst({
            where: {
                id,
                position: {
                    companyId: employee.companyId
                }
            },
            select: companyApplicationSelect
        })

        if (!application) return res.status(404).json({ message: "Nem található jelentkezés vagy nincs jogosultsága." })

        if (application.status !== ApplicationStatus.SUBMITTED) return res.status(400).json({ message: "Csak beadott jelentkezéseket lehet elbírálni." })

        if (status === ApplicationStatus.SUBMITTED) return res.status(400).json({ message: "Nem lehet BEADOTT státuszra állítani a jelentkezést." })

        const evaluateApplication = await prisma.application.update({
            where: { id },
            data: {
                status,
                companyNote,
            }
        })

        const message = status + "_APPLICATION"

        await logAction(req, {
            action: message,
            entity: "Application",
            entityId: application.id,
            details: {
                position: application.position.title,
                company: application.position.company.name,
                studentId: application.student.id,
                evaluatedBy: userId
            }
        })

        return res.json(evaluateApplication)
    } catch (error) {
        return res.status(500).json({ message: "Hiba az elbírálás során." })
    }
}

export const getMyCompanyApplications = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    if (!userId) return res.status(401).json({ message: "Nem található felhasználói azonosító." })

    try {

        const company = await prisma.company.findFirst({
            where: {
                employees: {
                    some: {
                        userId,
                        deletedAt: null
                    }
                }
            },
            select: { id: true }
        })

        if (!company) return res.status(404).json({ message: "Nem található cég." })

        const applications = await prisma.application.findMany({
            where: {
                position: {
                    companyId: company.id
                }
            },
            select: companyApplicationSelect,
            orderBy: { submittedAt: "desc" }
        })

        return res.json(applications.map(mapApplication))
    } catch (error) {
        return res.status(500).json({ message: "Hiba a lekérdezés során." })
    }
}

export const updateEvaluation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, companyNote } = req.body;
    const userId = req.user!.userId;

    try {
        const employee = await prisma.companyEmployee.findFirst({
            where: { userId, deletedAt: null }
        });

        if (!employee) {
            return res.status(403).json({ message: "Nincs céges jogosultsága." });
        }

        const application = await prisma.application.findFirst({
            where: {
                id,
                position: {
                    companyId: employee.companyId
                }
            },
            select: companyApplicationSelect
        })

        if (!application) return res.status(404).json({ message: "Nem található jelentkezés vagy nincs jogosultsága." })

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                status,
                companyNote
            }
        })

        await logAction(req, {
            action: "UPDATE_EVALUATION",
            entity: "Application",
            entityId: application.id,
            details: {
                updatedBy: req.user!.userId,
                position: application.position.title,
                company: application.position.company.name,
                studentId: application.student.id
            }
        })

        return res.json(updatedApplication)
    } catch (error) {
        return res.status(500).json({ message: "Hiba a módosítás során." })
    }
}
