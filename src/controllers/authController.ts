import { Request, Response } from "express";
import prisma from "../config/prisma";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { RegisterInput, LoginInput } from "../schemas/authSchema";
import { logAction } from "../utils/logger";

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    const data = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return res.status(400).json({ message: "A megadott email címmel már létezik felhasználó." });
        }

        const hashedPassword = await hashPassword(data.password);

        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    role: data.role
                }
            });

            switch (data.role) {
                case "STUDENT":
                    await tx.studentProfile.create({
                        data: {
                            userId: user.id,
                            mothersName: data.mothersName,
                            birthDate: data.dateOfBirth,

                            // Cím adatok - Location modellbe szervezve
                            locations: {
                                create: {
                                    country: data.country || "Magyarország",
                                    zipCode: data.zipCode ? String(data.zipCode) : "",
                                    city: data.city || "",
                                    address: data.streetAddress || ""
                                }
                            },


                            highSchool: data.highSchool,
                            graduationYear: data.graduationYear,
                            neptunCode: data.neptunCode,
                            currentMajor: data.currentMajor,
                            studyMode: data.studyMode,
                            hasLanguageCert: Boolean(data.hasLanguageCert)
                        }
                    });
                    break;
                case "MENTOR":
                    if (!data.companyId) {
                        throw new Error("Cég azonosító kötelező a mentor regisztrációhoz.");
                    }
                    await tx.companyEmployee.create({
                        data: {
                            userId: user.id,
                            companyId: data.companyId,
                            jobTitle: data.jobTitle
                        }
                    });
                    break;
                case "UNIVERSITY_USER":
                    // Jelenleg nincs további adat a UNIVERSITY_USER számára
                    break;
                case "COMPANY_ADMIN":
                    if (!data.companyId) {
                        throw new Error("Cég azonosító kötelező a cégadmin regisztrációhoz.");
                    }
                    await tx.companyEmployee.create({
                        data: {
                            userId: user.id,
                            companyId: data.companyId,
                            jobTitle: data.jobTitle
                        }
                    });
                    break;
                case "SYSTEM_ADMIN":
                    // Jelenleg nincs további adat a SYSTEM_ADMIN számára
                    break;
                default:
                    throw new Error("Ismeretlen szerepkör a regisztráció során");
            }

            return user;
        });

        await logAction(req, {
            action: "USER_REGISTERED",
            entity: "User",
            entityId: newUser.id,
            details: {
                email: newUser.email,
                role: newUser.role,
                fullName: newUser.fullName
            }
        });

        res.status(201).json({ message: "Sikeres regisztráció", userId: newUser.id, role: newUser.role });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            message: "Hiba történt a regisztráció során",
            error: error instanceof Error ? error.message : error
        });
    }
};

export const login = async (req: Request<{}, {}, LoginInput>, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: "Hibás email vagy jelszó." });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Hibás email vagy jelszó." });
        }

        const token = generateToken(user.id, user.role);

        await logAction(req, {
            action: "USER_LOGIN",
            entity: "User",
            entityId: user.id,
            details: { email: user.email, role: user.role }
        });

        res.json({
            message: "Sikeres bejelentkezés",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            message: "Hiba történt a bejelentkezés során",
            error: error instanceof Error ? error.message : error
        });
    }

};
