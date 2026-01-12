import { Request, Response } from 'express';
import prisma from '../config/prisma';

const studentSelect = {
    id: true,
    email: true,
    fullName: true,
    phoneNumber: true,
    role: true,
    studentProfile: {
        select: {
            id: true,
            mothersName: true,
            birthDate: true,
            country: true,
            zipCode: true,
            city: true,
            streetAddress: true,
            highSchool: true,
            graduationYear: true,
            neptunCode: true,
            currentMajor: true,
            studyMode: true,
            hasLanguageCert: true
        }
    }
};

export const getMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: "Nincs azonosítva a felhasználó." });
    }

    try {
        const student = await prisma.user.findUnique({
            where: { id: userId },
            select: studentSelect
        })

        if (!student) {
            return res.status(404).json({ message: "Profil nem található." });
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: "Hiba a profil lekérésekor." });
    }
}

export const getStudentById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const student = await prisma.user.findFirst({
            where: { id, role: "STUDENT" },
            select: studentSelect
        });

        if (!student) return res.status(404).json({ message: "Hallgató nem található." });

        // Biztonsági mentőöv: ha a select valamiért csődöt mondana
        const safeStudent = JSON.parse(JSON.stringify(student));
        delete safeStudent.password;

        res.status(200).json(safeStudent);
    } catch (error) {
        res.status(500).json({ message: "Hiba a hallgató lekérésekor." });
    }
}

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            select: studentSelect,
            orderBy: { createdAt: "desc" }
        })
        res.status(200).json(students);
    } catch (error) {
        console.error("GetAllStudents Error:", error);
        res.status(500).json({ message: "Hiba történt a hallgatók listázásakor." });
    }
}

export const updateMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { fullName, phoneNumber, ...profileData } = req.body;

    if (!userId) res.sendStatus(401);

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                phoneNumber,
                studentProfile: {
                    update: profileData
                }
            },
            select: studentSelect
        })
        res.json({ message: "Profilod sikeresen frissítve!", user: updated });
    } catch (error) {
        res.status(500).json({ message: "Hiba a profil frissítése során." });
    }

}

export const updateStudentById = async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = req.body;
    const { fullName, phoneNumber, ...profileData } = data;
    try {
        // 2. Frissítés egyetlen tranzakcióban (Nested Update)
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                studentProfile: {
                    update: profileData // A profil adatokat ide küldjük
                }
            },
            select: studentSelect
        });

        res.status(200).json({
            message: "Hallgatói adatok sikeresen frissítve.",
            user: updatedUser
        });

    } catch (error: any) {
        // Ha nem található az ID
        if (error.code === "P2025") {
            return res.status(404).json({ message: "A megadott azonosítóval nem található hallgató." });
        }

        console.error("Student Update Error:", error);
        res.status(500).json({ message: "Szerver hiba történt a módosítás során." });
    }
}

export const deleteMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
                studentProfile: {
                    update: { deletedAt: new Date() }
                }
            }
        });
        res.json({ message: "Profilod sikeresen törölve." })
    } catch (error) {
        res.status(500).json({ message: "Hiba a törlés során." });
    }
}

export const deleteStudentById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(),
                studentProfile: {
                    update: { deletedAt: new Date() }
                }
            }
        })
        res.json({ message: "A hallgatói profil sikeresen törölve." });
    } catch (error) {
        res.status(404).json({ message: "A hallgató nem található vagy már törölték." });
    }
}