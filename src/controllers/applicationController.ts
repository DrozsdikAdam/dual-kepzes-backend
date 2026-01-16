import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";

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
            select: { id: true, title: true, isActive: true, company: { select: { id: true, name: true } } }
        })

        if (!position || !position.isActive) {
            return res.status(404).json({ message: "A pozíció nem elérhető." })
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