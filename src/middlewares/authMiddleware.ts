import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Hozzáférés megtagadva: nincs token megadva." });
    }

    // SECURITY: Ensure JWT_SECRET is set in environment
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return res.status(500).json({ message: "Belső szerverhiba." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: "Érvénytelen token" });
        }

        try {
            // Verify user exists in database and is active
            const dbUser = await import("../config/prisma").then(m => m.default.user.findUnique({
                where: { id: user.userId }
            }));

            if (!dbUser) {
                return res.status(401).json({ message: "A felhasználó nem található." });
            }

            if (!dbUser.isActive) {
                return res.status(403).json({ message: "A felhasználói fiók inaktív." });
            }

            // Ha törölve van (bár a findUnique a prisma middleware miatt elvileg nem adja vissza, de biztos ami biztos)
            if (dbUser.deletedAt) {
                return res.status(401).json({ message: "A felhasználói fiók törölve lett." });
            }

            req.user = user;
            next();
        } catch (dbError) {
            console.error("Auth middleware db error:", dbError);
            return res.status(500).json({ message: "Belső szerverhiba a hitelesítés során." });
        }
    });
};

export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        if (!req.user) {
            return res.status(401).json({ message: "Nem vagy bejelentkezve." });
        }

        if (!allowedRoles.includes(req.user!.role)) {
            return res.status(403).json({ message: "Nincs jogosultságod a művelet végrehajtásához." });
        }

        next();
    };
};


// Csak Diákoknak
export const isStudent = requireRole([Role.STUDENT]);
// Csak Mentoroknak
export const isMentor = requireRole([Role.MENTOR]);
// Csak Cég Adminoknak
export const isCompanyAdmin = requireRole([Role.COMPANY_ADMIN]);
// Csak Rendszer Adminoknak
export const isSystemAdmin = requireRole([Role.SYSTEM_ADMIN]);
// Csak Egyetemi Felhasználóknak
export const isUniversityUser = requireRole([Role.UNIVERSITY_USER]);
// Csak céges dolgozóknak
export const isCompanyEmployee = requireRole([Role.MENTOR, Role.COMPANY_ADMIN]);
// Csak iskolai dolgozóknak
export const isUniversityStaff = requireRole([Role.UNIVERSITY_USER, Role.SYSTEM_ADMIN]);
// Csak dolgozóknak
export const isStaff = requireRole([
    Role.MENTOR,
    Role.COMPANY_ADMIN,
    Role.UNIVERSITY_USER,
    Role.SYSTEM_ADMIN
]);
