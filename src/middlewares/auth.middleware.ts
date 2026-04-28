import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";

export const authenticateToken = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next(new UnauthorizedError("Hozzaferes megtagadva: nincs token megadva."));
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return next(new Error("JWT_SECRET is not defined in environment variables."));
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err: any, user: any) => {
        if (err) {
            return next(new ForbiddenError("Ervenytelen token."));
        }

        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                include: {
                    studentProfile: true,
                },
            });

            if (!dbUser) {
                return next(new UnauthorizedError("A felhasznalo nem talalhato."));
            }

            if (!dbUser.isActive) {
                return next(new ForbiddenError("A felhasznaloi fiok inaktiv."));
            }

            if (dbUser.deletedAt) {
                return next(new UnauthorizedError("A felhasznaloi fiok torolve lett."));
            }

            req.user = user;
            if (dbUser.studentProfile && req.user) {
                req.user.studentProfileId = dbUser.studentProfile.id;
            }

            return next();
        } catch (dbError) {
            console.error("Auth middleware db error:", dbError);
            return next(dbError);
        }
    });
};

export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError("Nem vagy bejelentkezve."));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError("Nincs jogosultsagod a muvelet vegrehajtasahoz.")
            );
        }

        return next();
    };
};

export const isStudent = requireRole([Role.STUDENT]);
export const isMentor = requireRole([Role.MENTOR]);
export const isCompanyAdmin = requireRole([Role.COMPANY_ADMIN]);
export const isSystemAdmin = requireRole([Role.SYSTEM_ADMIN]);
export const isUniversityUser = requireRole([Role.UNIVERSITY_USER]);
export const isCompanyEmployee = requireRole([Role.MENTOR, Role.COMPANY_ADMIN]);
export const isUniversityStaff = requireRole([Role.UNIVERSITY_USER, Role.SYSTEM_ADMIN]);
export const isStaff = requireRole([
    Role.MENTOR,
    Role.COMPANY_ADMIN,
    Role.UNIVERSITY_USER,
    Role.SYSTEM_ADMIN,
]);
