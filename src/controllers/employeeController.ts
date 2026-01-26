import { Request, Response } from "express"
import prisma from "../config/prisma"
import { UpdateEmployeeInput } from "../schemas/employeeSchema"
import { Role } from "@prisma/client"
import { logAction } from "../utils/logger";

// 1. SELECT definíciók a konzisztencia érdekében
// Amikor User-t kérünk le dolgozói adatokkal
const userEmployeeSelect = {
    id: true,
    email: true,
    fullName: true,
    phoneNumber: true,
    role: true,
    companyEmployee: {
        select: {
            id: true,
            jobTitle: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true
                }
            }
        }
    }
};

// Amikor a CompanyEmployee profilból indulunk ki
const employeeProfileSelect = {
    id: true,
    jobTitle: true,
    companyId: true,
    user: {
        select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
            isActive: true
        }
    }
};

const dualPartnershipSelect = {
    id: true,
    status: true,
    contractNumber: true,
    startDate: true,
    endDate: true,
    student: {
        select: {
            id: true,
            neptunCode: true,
            currentMajor: true,
            studyMode: true,
            user: {
                select: {
                    fullName: true,
                    email: true,
                    phoneNumber: true
                }
            }
        }
    },
    uniEmployee: {
        select: {
            fullName: true,
            email: true
        }
    }
}


export const getMeEmployee = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "Nincs azonosított felhasználó." });
    }

    try {
        const employee = await prisma.companyEmployee.findUnique({
            where: { userId },
            select: employeeProfileSelect
        });

        if (!employee) {
            return res.status(404).json({ message: "A dolgozó profil nem található." });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: "Hiba a profil lekérésekor." });
    }
}

export const updateMeEmployee = async (req: Request<{}, {}, UpdateEmployeeInput>, res: Response) => {
    const userId = req.user?.userId;
    const { fullName, phoneNumber } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Nincs azonosított felhasználó." });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                phoneNumber
            },
            select: userEmployeeSelect
        });

        await logAction(req, {
            action: "UPDATE_MY_PROFILE",
            entity: "User",
            entityId: userId,
            details: {
                updatedFields: { fullName, phoneNumber }
            }
        })

        res.json({
            message: "Profil sikeresen frissítve.",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: "Hiba a profil frissítésekor." });
    }
}

export const deleteMeEmployee = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "Nincs azonosított felhasználó." });
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
                companyEmployee: { update: { deletedAt: new Date() } }
            }
        });

        await logAction(req, {
            action: "DELETE_MY_PROFILE",
            entity: "User",
            entityId: userId
        })

        res.json({ message: "Profil sikeresen törölve." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a profil törlésekor." });
    }
}

export const getEmployeeById = async (req: Request, res: Response) => {
    const userToFind = req.params.id;
    const currentUser = req.user!;

    try {
        const target = await prisma.companyEmployee.findUnique({
            where: { userId: userToFind },
            select: employeeProfileSelect
        });
        const requester = await prisma.companyEmployee.findUnique({
            where: { userId: currentUser.userId }
        });

        if (!target) {
            return res.status(404).json({ message: "A dolgozó nem található." });
        }

        const isSameCompany = requester && target.companyId === requester.companyId;

        if (!isSameCompany) {
            return res.status(403).json({ message: "Nincs jogosultságod a dolgozó adatainak megtekintéséhez." });
        }

        await logAction(req, {
            action: "VIEW_EMPLOYEE",
            entity: "User",
            entityId: userToFind,
            details: {
                viewerId: currentUser.userId
            }
        })

        res.json(target);
    } catch (error) {
        res.status(500).json({ message: "Hiba a dolgozó lekérésekor." });
    }
}

import { getCompanyIdForUser } from "../utils/companyUtils";

export const getCompanyEmployees = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Nincs azonosítva." });

    try {
        const companyId = await getCompanyIdForUser(req.user.userId);

        if (!companyId || (req.user.role !== "COMPANY_ADMIN")) {
            return res.status(403).json({ message: "Nincs jogosultságod a lista megtekintéséhez." });
        }

        const employees = await prisma.user.findMany({
            where: {
                companyEmployee: { companyId: companyId },
            },
            select: userEmployeeSelect,
            orderBy: { fullName: "asc" }
        });

        await logAction(req, {
            action: "VIEW_EMPLOYEES",
            entity: "User",
            details: {
                viewerId: req.user.userId
            }
        })

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: "Hiba a lekérdezés során." });
    }
};

export const getCompanyMentors = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Nincs azonosítva." });

    try {
        const companyId = await getCompanyIdForUser(req.user.userId);

        if (!companyId || (req.user.role !== "COMPANY_ADMIN")) {
            return res.status(403).json({ message: "Nincs jogosultságod a lista megtekintéséhez." });
        }

        const mentors = await prisma.user.findMany({
            where: {
                companyEmployee: { companyId: companyId },
                role: Role.MENTOR
            },
            select: userEmployeeSelect,
            orderBy: { fullName: "asc" }
        });

        res.json(mentors);
    } catch (error) {
        res.status(500).json({ message: "Hiba a mentorok lekérdezése során." });
    }
};

export const updateEmployeeById = async (req: Request<{ id: string }, {}, UpdateEmployeeInput>, res: Response) => {
    const userIdToUpdate = req.params.id;
    const { fullName, phoneNumber, jobTitle, isActive } = req.body;

    // A req.user itt már garantáltan létezik a middleware-ek miatt
    const currentUser = req.user!;

    try {
        // 1. Adatok lekérése az ellenőrzéshez
        const target = await prisma.companyEmployee.findUnique({ where: { userId: userIdToUpdate } });
        const requester = await prisma.companyEmployee.findUnique({ where: { userId: currentUser.userId } });

        if (!target || !requester) {
            return res.status(404).json({ message: "A kért profil nem található." });
        }

        // 2. JOGOSULTSÁG ELLENŐRZÉSE (Kontroller szinten)
        const isSelf = userIdToUpdate === currentUser.userId;
        const isAdminAtSameCompany = currentUser.role === Role.COMPANY_ADMIN && target.companyId === requester.companyId;

        // Ha nem saját maga, nem az adminja és nem rendszeradmin -> Tiltás
        if (!isSelf && !isAdminAtSameCompany) {
            return res.status(403).json({ message: "Nincs jogosultságod más dolgozó adatainak módosításához." });
        }

        // 3. FRISSÍTÉS (Nested Update)
        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: {
                fullName,
                phoneNumber,
                // Biztonság: Az isActive státuszt csak ADMIN-ok állíthatják
                isActive: (isAdminAtSameCompany) ? isActive : undefined,
                companyEmployee: {
                    update: {
                        jobTitle: jobTitle
                    }
                }
            },
            select: userEmployeeSelect
        });


        await logAction(req, {
            action: "UPDATE_EMPLOYEE",
            entity: "User",
            entityId: userIdToUpdate,
            details: {
                updatedFields: { fullName, phoneNumber, jobTitle, isActive },
                updatedBy: currentUser.userId
            }
        })

        res.status(200).json({
            message: "Adatok sikeresen frissítve.",
            user: updatedUser
        });

    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Nem található a módosítandó rekord." });
        }
        res.status(500).json({ message: "Szerver hiba történt." });
    }
};

export const deleteEmployeeById = async (req: Request, res: Response) => {
    const userIdToDelete = req.params.id;

    try {
        const target = await prisma.companyEmployee.findUnique({ where: { userId: userIdToDelete } });
        const requester = await prisma.companyEmployee.findUnique({ where: { userId: req.user!.userId } });

        if (!target || !requester) return res.status(404).json({ message: "Nem található." });

        // Csak azt kell ellenőrizni, hogy ugyanaz a cég-e
        if (target.companyId !== requester.companyId) {
            return res.status(403).json({ message: "Csak a saját céged dolgozóit törölheted." });
        }

        await prisma.user.update({
            where: { id: userIdToDelete },
            data: {
                isActive: false,
                deletedAt: new Date(),
                companyEmployee: { update: { deletedAt: new Date() } }
            }
        });

        await logAction(req, {
            action: "DELETE_EMPLOYEE",
            entity: "User",
            entityId: userIdToDelete,
            details: {
                deletedBy: req.user!.userId
            }
        })

        res.json({ message: "Munkavállaló sikeresen eltávolítva." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a törlés során." });
    }
};

export const getMyStudents = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Nincs jogosultságod." })
    }

    try {
        // 1. Megkeressük a mentor munkavállalói profilját az ID-ja miatt
        const mentorProfile = await prisma.companyEmployee.findUnique({
            where: { userId },
            select: { id: true, companyId: true }
        });

        if (!mentorProfile) {
            return res.status(403).json({ message: "Nem található munkavállalói (mentor) profil." });
        }

        // 2. Lekérjük az összes olyan partnerséget, ahol ez a dolgozó a mentor
        const partnerships = await prisma.dualPartnership.findMany({
            where: {
                mentorId: mentorProfile.id,
            },
            select: dualPartnershipSelect,
            orderBy: {
                startDate: "desc"
            }
        });

        return res.json(partnerships)
    } catch (error) {
        return res.status(500).json({ message: "Hiba a hallgatók lekérésekor." })
    }
}

export const getMyPartnershipById = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
        return res.status(401).json({ message: "Nincs jogosultságod." })
    }

    try {
        const mentorProfile = await prisma.companyEmployee.findFirst({
            where: { userId },
            select: { id: true, companyId: true }
        })

        if (!mentorProfile) {
            return res.status(403).json({ message: "Nem található mentor profil." })
        }

        const partnership = await prisma.dualPartnership.findFirst({
            where: { mentorId: mentorProfile.id, id },
            select: dualPartnershipSelect
        })

        if (!partnership) {
            return res.status(404).json({ message: "Nem található a keresett partnerség." })
        }

        return res.json(partnership)
    } catch (error) {
        return res.status(500).json({ messsage: "Hiba a partnerség lekérésekor." })
    }
}