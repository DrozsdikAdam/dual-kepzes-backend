import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";
import { mapStudent } from "../utils/mappers";

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

        res.status(200).json(mapStudent(student));
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

        await logAction(req, {
            action: "VIEW_STUDENT",
            entity: "User",
            entityId: id,
            details: {
                viewerId: req.user?.userId,
            }

        })

        res.status(200).json(mapStudent(student));
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


        // LISTÁZÁS NAPLÓZÁSA
        await logAction(req, {
            action: "LIST_STUDENTS",
            entity: "User",
            details: { listById: req.user?.userId, count: students.length }
        });

        res.status(200).json(students.map(mapStudent));
    } catch (error) {
        console.error("GetAllStudents Error:", error);
        res.status(500).json({ message: "Hiba történt a hallgatók listázásakor." });
    }
}

export const updateMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { fullName, phoneNumber, ...profileData } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Nincs azonosítva." }); // Sent status should return json if expected
    }

    try {
        const { location, ...otherProfileData } = profileData;

        // Fetch current profile to get location ID
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { studentProfile: { select: { id: true, locations: { select: { id: true } } } } }
        });

        let locationsUpdate = undefined;
        if (location) {
            const existingLocation = currentUser?.studentProfile?.locations?.[0];
            if (existingLocation) {
                locationsUpdate = {
                    update: {
                        where: { id: existingLocation.id },
                        data: {
                            country: location.country,
                            zipCode: location.zipCode,
                            city: location.city,
                            address: location.address
                        }
                    }
                };
            } else {
                locationsUpdate = {
                    create: {
                        country: location.country || "Magyarország",
                        zipCode: location.zipCode || "",
                        city: location.city || "",
                        address: location.address || ""
                    }
                };
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                phoneNumber,
                studentProfile: {
                    update: {
                        ...otherProfileData,
                        locations: locationsUpdate
                    }
                }
            },
            select: studentSelect
        })

        await logAction(req, {
            action: "UPDATE_OWN_PROFILE",
            entity: "User",
            entityId: userId,
            details: { updatedById: req.user?.userId, updatedFields: Object.keys(req.body) }
        });

        res.json({ message: "Profilod sikeresen frissítve!", user: mapStudent(updated) });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Hiba a profil frissítése során." });
    }

}

export const updateStudentById = async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = req.body;
    const { fullName, phoneNumber, ...profileData } = data;
    try {
        // 1. Ellenőrizzük, hogy a felhasználó létezik és DIÁK
        const target = await prisma.user.findFirst({
            where: { id: id, role: "STUDENT" },
            select: { studentProfile: { select: { id: true, locations: { select: { id: true } } } } }
        })

        if (!target) {
            return res.status(404).json({ message: "Nem található a módosítandó hallgató." });
        }

        const { location, ...otherProfileData } = profileData;

        // Prepare location update
        let locationsUpdate = undefined;
        if (location) {
            const existingLocation = target.studentProfile?.locations?.[0];
            if (existingLocation) {
                locationsUpdate = {
                    update: {
                        where: { id: existingLocation.id },
                        data: {
                            country: location.country,
                            zipCode: location.zipCode,
                            city: location.city,
                            address: location.address
                        }
                    }
                };
            } else {
                locationsUpdate = {
                    create: {
                        country: location.country || "Magyarország",
                        zipCode: location.zipCode || "",
                        city: location.city || "",
                        address: location.address || ""
                    }
                };
            }
        }

        // 2. Frissítés egyetlen tranzakcióban (Nested Update)
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                studentProfile: {
                    update: {
                        ...otherProfileData,
                        locations: locationsUpdate
                    }
                }
            },
            select: studentSelect
        });

        await logAction(req, {
            action: "UPDATE_STUDENT_BY_ADMIN",
            entity: "User",
            entityId: id,
            details: {
                updatedBy: req.user?.userId,
                updatedFields: Object.keys(data)
            }
        });

        res.status(200).json({
            message: "Hallgatói adatok sikeresen frissítve.",
            user: mapStudent(updatedUser)
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

        await logAction(req, {
            action: "DELETE_OWN_PROFILE",
            entity: "User",
            entityId: userId,
            details: { reason: "User self-deletion" }
        });

        res.json({ message: "Profilod sikeresen törölve." })
    } catch (error) {
        res.status(500).json({ message: "Hiba a törlés során." });
    }
}

export const deleteStudentById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const target = await prisma.user.findFirst({
            where: { id: id, role: "STUDENT" }
        })

        if (!target) {
            return res.status(404).json({ message: "Nem található a hallgató." });
        }

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

        await logAction(req, {
            action: "DELETE_STUDENT_BY_ADMIN",
            entity: "User",
            entityId: id,
            details: { deletedBy: req.user?.userId }
        });

        res.json({ message: "A hallgatói profil sikeresen törölve." });
    } catch (error) {
        res.status(404).json({ message: "A hallgató nem található vagy már törölték." });
    }
}
