import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { RegisterInput, LoginInput } from "../schemas/authSchema";

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    const { email, password, role, ...studentData } = req.body as any;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if (existingUser) {
            return res.status(400).json({ message: 'A megadott email címmel már létezik felhasználó.' })
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role
                }
            });

            if (role === 'STUDENT') {
                await tx.studentProfile.create({
                    data: {
                        userId: user.id,
                        fullName: studentData.fullName,
                        mothersName: studentData.mothersName,
                        // Dátum konvertálása stringből
                        birthDate: new Date(studentData.dateOfBirth),

                        // Cím adatok (Adatbázis sémához igazítva)
                        country: studentData.country || "Magyarország",
                        zipCode: String(studentData.zipCode), // FONTOS: Szám -> String konverzió!
                        city: studentData.city,
                        streetAddress: studentData.streetAddress,

                        highSchool: studentData.highSchool,
                        graduationYear: Number(studentData.graduationYear), // String -> Number
                        neptunCode: studentData.neptuneCode, // PowerShellben 'neptuneCode' volt
                        currentMajor: studentData.currentMajor,
                        studyMode: studentData.studyMode,
                        hasLanguageCert: Boolean(studentData.hasLanguageCert)
                    }
                });
            }

            return user;
        });

        res.status(201).json({ message: 'Sikeres regisztráció', userId: newUser.id, role: newUser.role })

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            message: 'Hiba történt a regisztráció során',
            error: error instanceof Error ? error.message : error
        })
    }
}

export const login = async (req: Request<{}, {}, LoginInput>, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            return res.status(400).json({ message: 'Hibás email vagy jelszó.' })
        }

        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return res.status(400).json({ message: 'Hibás email vagy jelszó.' })
        }

        const token = generateToken(user.id, user.role)

        res.json({
            message: 'Sikeres bejelentkezés',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során', error: error })
    }

}