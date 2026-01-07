import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT', deletedAt: null },
            include: { studentProfile: true },
            orderBy: { createdAt: 'desc' }
        })
        res.status(200).json(students);
    } catch (error) {
        console.error("GetAllStudents Error:", error);
        res.status(500).json({ message: "Hiba történt a hallgatók listázásakor." });
    }
}

export const updateSutdent = async (req: Request, res: Response) => {
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
            include: { studentProfile: true }
        });

        res.status(200).json({
            message: "Hallgatói adatok sikeresen frissítve.",
            user: updatedUser
        });

    } catch (error: any) {
        // Ha nem található az ID
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "A megadott azonosítóval nem található hallgató." });
        }

        console.error("Student Update Error:", error);
        res.status(500).json({ message: "Szerver hiba történt a módosítás során." });
    }
}