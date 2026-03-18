import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

export class AnonymizeService {
    /**
     * Anonimizál egy hallgatói profilt és a hozzá tartozó felhasználót.
     */
    async anonymizeStudentProfile(studentProfileId: string) {
        const SALT_ROUNDS = 10;
        const anonymizedPassword = await bcrypt.hash("ANONYMIZED_USER_123!", SALT_ROUNDS);

        return await prisma.$transaction(async (tx) => {
            const profile = await tx.studentProfile.findUnique({
                where: { id: studentProfileId },
                include: { user: true }
            });

            if (!profile) {
                throw new Error("A megadott hallgatói profil nem található.");
            }

            // 1. Felhasználó (User) anonimizálása
            await tx.user.update({
                where: { id: profile.userId },
                data: {
                    email: `anonymized_${profile.userId.substring(0, 8)}@deleted.com`,
                    fullName: "Anonimizált Felhasználó",
                    phoneNumber: "00000000000",
                    password: anonymizedPassword,
                    isActive: false,
                    deletedAt: new Date()
                }
            });

            // 2. Hallgatói profil (StudentProfile) anonimizálása
            await tx.studentProfile.update({
                where: { id: studentProfileId },
                data: {
                    mothersName: "Anonimizált",
                    birthDate: new Date("1900-01-01"),
                    neptunCode: `ANON_${profile.id.substring(0, 4)}`,
                    motivationLetter: "Tartalom törölve.",
                    deletedAt: new Date()
                }
            });

            // 3. Helyszínek (Location) anonimizálása
            await tx.location.updateMany({
                where: { studentProfileId },
                data: {
                    zipCode: "0000",
                    city: "Anonimizált",
                    address: "Anonimizált utca 1."
                }
            });

            return { success: true, message: "A hallgatói profil sikeresen anonimizálva." };
        });
    }

    /**
     * Anonimizál egy céget, a hozzá tartozó helyszíneket, pozíciókat és munkavállalókat.
     */
    async anonymizeCompany(companyId: string) {
        const SALT_ROUNDS = 10;
        const anonymizedPassword = await bcrypt.hash("ANONYMIZED_COMPANY_USER_123!", SALT_ROUNDS);

        return await prisma.$transaction(async (tx) => {
            const company = await tx.company.findUnique({
                where: { id: companyId },
                include: {
                    employees: {
                        select: { userId: true, id: true }
                    },
                    positions: {
                        select: { id: true }
                    }
                }
            });

            if (!company) {
                throw new Error("A megadott cég nem található.");
            }

            // 1. Cég (Company) anonimizálása
            await tx.company.update({
                where: { id: companyId },
                data: {
                    name: "Anonimizált Cég",
                    taxId: `ANON_${companyId.substring(0, 8)}`,
                    contactName: "Anonimizált Kapcsolattartó",
                    contactEmail: `contact_${companyId.substring(0, 8)}@deleted.com`,
                    website: "https://deleted.com",
                    description: "Leírás törölve.",
                    isActive: false,
                    deletedAt: new Date()
                }
            });

            // 2. Helyszínek (Location) anonimizálása
            await tx.location.updateMany({
                where: { companyId },
                data: {
                    zipCode: "0000",
                    city: "Anonimizált",
                    address: "Anonimizált utca 1."
                }
            });

            // 3. Pozíciók (Position) anonimizálása
            await tx.position.updateMany({
                where: { companyId },
                data: {
                    title: "Anonimizált Pozíció",
                    description: "Pozíció leírása törölve.",
                    isActive: false,
                    deletedAt: new Date()
                }
            });

            // 4. Munkavállalók (User és CompanyEmployee) anonimizálása
            for (const employee of company.employees) {
                // User anonimizálása
                await tx.user.update({
                    where: { id: employee.userId },
                    data: {
                        email: `anonymized_emp_${employee.userId.substring(0, 8)}@deleted.com`,
                        fullName: "Anonimizált Munkavállaló",
                        phoneNumber: "00000000000",
                        password: anonymizedPassword,
                        isActive: false,
                        deletedAt: new Date()
                    }
                });

                // CompanyEmployee rekord törlése/jelölése (ha van deletedAt a modellben)
                await tx.companyEmployee.update({
                    where: { id: employee.id },
                    data: {
                        jobTitle: "Anonimizált munkakör",
                        deletedAt: new Date()
                    }
                });
            }

            return { success: true, message: "A cég és minden kapcsolódó adat sikeresen anonimizálva." };
        });
    }
}

export const anonymizeService = new AnonymizeService();
