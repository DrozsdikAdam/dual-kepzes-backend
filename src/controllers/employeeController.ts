import { Request, Response } from "express"
import prisma from "../config/prisma"
import { UpdateEmployeeInput } from "../schemas/employeeSchema"
import { Role } from "@prisma/client"

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

        res.json(target);
    } catch (error) {
        res.status(500).json({ message: "Hiba a dolgozó lekérésekor." });
    }
}

export const getCompanyEmployees = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Nincs azonosítva." });

    try {
        const requester = await prisma.companyEmployee.findUnique({ where: { userId: req.user.userId } });

        if (!requester || (req.user.role !== 'COMPANY_ADMIN')) {
            return res.status(403).json({ message: "Nincs jogosultságod a lista megtekintéséhez." });
        }

        const employees = await prisma.user.findMany({
            where: {
                companyEmployee: { companyId: requester.companyId },
            },
            select: userEmployeeSelect,
            orderBy: { fullName: 'asc' }
        });

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: "Hiba a lekérdezés során." });
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

        res.status(200).json({
            message: "Adatok sikeresen frissítve.",
            user: updatedUser
        });

    } catch (error: any) {
        if (error.code === 'P2025') {
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

        res.json({ message: "Munkavállaló sikeresen eltávolítva." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a törlés során." });
    }
};