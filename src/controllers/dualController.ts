import { Request, Response } from "express";
import prisma from "../config/prisma";
import { DualPartnershipUpdateRequest } from "../schemas/dualSchema";
import { PartnershipStatus } from "@prisma/client";
import { logAction } from "../utils/logger";
import { mapDualPartnership } from "../utils/mappers";
import { getCompanyIdForUser } from "../utils/companyUtils";

const partnershipSelect = {
    id: true,
    semester: true,
    contractNumber: true,
    status: true,
    startDate: true,
    endDate: true,
    student: {
        select: {
            id: true,
            userId: true,
            user: { select: { email: true, fullName: true } },
            mothersName: true,
            birthDate: true,
            highSchool: true,
            graduationYear: true,
            neptunCode: true,
        }
    },
    mentor: {
        select: {
            userId: true,
            user: { select: { email: true, fullName: true } },
            company: { select: { id: true, name: true } },
            jobTitle: true,
        }
    },
    position: {
        select: {
            id: true,
            title: true,
            companyId: true,
            company: { select: { name: true } }
        }
    },
    uniEmployee: {
        select: {
            id: true,
            email: true,
            fullName: true,
        }
    },
    createdAt: true,
    updatedAt: true,
};




export const getPartnershipById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    try {
        const companyId = await getCompanyIdForUser(userId);

        const partnership = await prisma.dualPartnership.findFirst({
            where: {
                id,
                // Match if user is mentor OR if the position belongs to their company
                ...(companyId && {
                    OR: [
                        { mentor: { companyId } },
                        { position: { companyId } }
                    ]
                })
            },
            select: partnershipSelect
        });

        if (!partnership) {
            // If it wasn't found with company scope, maybe it's a student
            if (!companyId) {
                const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
                const studentPartnership = await prisma.dualPartnership.findFirst({
                    where: { id, studentId: studentProfile?.id },
                    select: partnershipSelect
                });

                if (!studentPartnership) {
                    return res.status(404).json({ message: "Partnerség nem található vagy nincs jogosultsága megtekinteni." });
                }
                return res.json(mapDualPartnership(studentPartnership));
            }

            return res.status(404).json({ message: "Partnerség nem található vagy nincs jogosultsága megtekinteni." });
        }

        res.json(mapDualPartnership(partnership));
    } catch (error) {
        res.status(500).json({ message: "Hiba a partnerség lekérésekor." });
    }
}


export const updatePartnership = async (
    req: Request<DualPartnershipUpdateRequest['params'], {}, DualPartnershipUpdateRequest['body']>,
    res: Response
) => {
    const { id } = req.params;
    const data = req.body;
    const { userId } = req.user!;

    try {
        const companyId = await getCompanyIdForUser(userId);
        if (!companyId) {
            return res.status(403).json({ message: "Nincs jogosultsága partnerséget frissíteni." });
        }

        const partnershipToUpdate = await prisma.dualPartnership.findFirst({
            where: {
                id,
                OR: [
                    { mentor: { companyId } },
                    { position: { companyId } }
                ]
            }
        });

        if (!partnershipToUpdate) {
            return res.status(404).json({ message: "Partnerség nem található vagy nincs jogosultsága frissíteni." });
        }

        const updatedPartnership = await prisma.dualPartnership.update({
            where: { id },
            data: {
                ...data,
                studentId: undefined, // Student cannot be changed
            },
            select: partnershipSelect
        });

        await logAction(req, {
            action: "UPDATE_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { updatedById: req.user?.userId, changedFields: Object.keys(data) }
        });

        return res.json({
            message: "Partnerség adatai sikeresen frissítve",
            partnership: mapDualPartnership(updatedPartnership)
        });

    } catch (error) {
        return res.status(500).json({ message: "Hiba a partnerség frissítésekor." });
    }
}

export const deletePartnership = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;

    try {
        const companyId = await getCompanyIdForUser(userId);
        if (!companyId) {
            return res.status(403).json({ message: "Nincs jogosultsága partnerséget törölni." });
        }

        const result = await prisma.dualPartnership.updateMany({
            where: {
                id,
                OR: [
                    { mentor: { companyId } },
                    { position: { companyId } }
                ]
            },
            data: { deletedAt: new Date() }
        });

        if (result.count === 0) {
            return res.status(404).json({ message: "Partnerség nem található vagy nincs jogosultsága törölni." });
        }

        await logAction(req, {
            action: "DELETE_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { deletedById: req.user?.userId }
        });

        return res.json({ message: "Partnerség sikeresen törölve." });
    } catch (error) {
        return res.status(500).json({ message: "Hiba a partnerség törlésekor." });
    }
}

export const terminatePartnership = async (req: Request, res: Response) => {
    const userId = req.user?.userId
    const { id } = req.params

    if (!userId) {
        return res.status(401).json({ message: "Nincs jogosultságod." })
    }

    try {
        const target = await prisma.dualPartnership.findUnique({ where: { id } })

        if (!target) {
            return res.status(404).json({ message: "Nem található partneri kapcsolat." })
        }

        const updated = await prisma.dualPartnership.update({
            where: { id },
            data: { status: PartnershipStatus.TERMINATED },
            select: partnershipSelect
        })

        await logAction(req, {
            action: "TERMINATE_DUAL_PARTNERSHIP",
            entity: "DualPartnership",
            entityId: id,
            details: { terminatedBy: userId }
        })

        return res.json({ message: "Partneri kapcsolat megszakítva.", updated })
    } catch (error) {
        return res.status(500).json({ message: "Hiba történt a a partneri kapcsolat megszüntetésekor." })
    }
}

export const assignMentor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mentorId } = req.body;
    const userId = req.user!.userId;

    try {
        const companyId = await getCompanyIdForUser(userId);
        if (!companyId) {
            return res.status(403).json({ message: "Nincs jogosultsága mentort hozzárendelni." });
        }

        const partnership = await prisma.dualPartnership.findFirst({
            where: { id },
            select: { status: true, studentId: true }
        });

        if (!partnership) return res.status(404).json({ message: "Nem található partnerség." });

        const validApplication = await prisma.application.findFirst({
            where: {
                studentId: partnership.studentId,
                status: 'ACCEPTED',
                position: {
                    companyId: companyId
                }
            }
        });

        if (!validApplication) {
            return res.status(403).json({ message: "Ez a partnerség nem a te cégedhez tartozik." });
        }

        // Logic to determine if mentorId is an Employee ID or User ID
        let finalMentorId = mentorId;

        // 1. Try to find by CompanyEmployee ID
        const employeeById = await prisma.companyEmployee.findUnique({
            where: { id: mentorId }
        });

        if (employeeById) {
            // Found by ID - verify company ownership
            if (employeeById.companyId !== companyId) {
                return res.status(400).json({ message: "A megadott mentor nem ehhez a céghez tartozik." });
            }
            finalMentorId = employeeById.id;
        } else {
            // 2. Try to find by User ID (common frontend mistake)
            const employeeByUserId = await prisma.companyEmployee.findUnique({
                where: { userId: mentorId }
            });

            if (employeeByUserId && employeeByUserId.companyId === companyId) {
                finalMentorId = employeeByUserId.id; // Correct to the Employee ID
            } else {
                return res.status(400).json({ message: "A megadott azonosítóval nem található mentor ennél a cégnél." });
            }
        }

        const updated = await prisma.dualPartnership.update({
            where: { id },
            data: {
                mentorId: finalMentorId,
                status: PartnershipStatus.PENDING_UNIVERSITY
            },
            select: partnershipSelect
        });

        await logAction(req, {
            action: "ASSIGN_MENTOR",
            entity: "DualPartnership",
            entityId: id,
            details: { assignedMentorId: finalMentorId, assignedBy: userId }
        });

        return res.json(updated);
    } catch (e: any) {
        console.error("Assign mentor error:", e);
        return res.status(500).json({ message: "Hiba a mentor hozzárendelésekor.", error: e.message });
    }
}

export const assignUniversityUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { uniEmployeeId } = req.body;

    try {
        const updated = await prisma.dualPartnership.update({
            where: { id },
            data: {
                uniEmployeeId: uniEmployeeId,
                status: PartnershipStatus.ACTIVE
            },
            select: partnershipSelect
        });

        await logAction(req, {
            action: "ASSIGN_UNI_USER",
            entity: "DualPartnership",
            entityId: id,
            details: { assignedUniUserId: uniEmployeeId, assignedBy: req.user!.userId }
        });

        return res.json(updated);
    } catch (e) {
        return res.status(500).json({ message: "Hiba az egyetemi felhasználó hozzárendelésekor." });
    }
}

export const getStudentPartnerships = async (req: Request, res: Response) => {
    const { userId } = req.user!;
    try {
        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!studentProfile) {
            return res.status(403).json({ message: "Nem található hallgatói profil." });
        }
        const partnerships = await prisma.dualPartnership.findMany({
            where: { studentId: studentProfile.id },
            select: partnershipSelect,
            orderBy: { createdAt: "desc" }
        });
        res.json(partnerships.map(mapDualPartnership));
    } catch (error) {
        res.status(500).json({ message: "Hiba a hallgatói partnerségek lekérésekor." });
    }
}

export const getCompanyPartnerships = async (req: Request, res: Response) => {
    const { userId } = req.user!;
    try {
        const companyId = await getCompanyIdForUser(userId);
        if (!companyId) {
            return res.status(403).json({ message: "Nincs céghez rendelve vagy nincs jogosultsága." });
        }
        const partnerships = await prisma.dualPartnership.findMany({
            where: {
                OR: [
                    { mentor: { companyId } },
                    { position: { companyId } }
                ]
            },
            select: partnershipSelect,
            orderBy: { createdAt: "desc" }
        });
        res.json(partnerships.map(mapDualPartnership));
    } catch (error) {
        res.status(500).json({ message: "Hiba a céges partnerségek lekérésekor." });
    }
}

export const getUniversityPartnerships = async (req: Request, res: Response) => {
    try {
        const partnerships = await prisma.dualPartnership.findMany({
            select: partnershipSelect,
            orderBy: { createdAt: "desc" }
        });
        res.json(partnerships.map(mapDualPartnership));
    } catch (error) {
        res.status(500).json({ message: "Hiba az egyetemi partnerségek lekérésekor." });
    }
}
