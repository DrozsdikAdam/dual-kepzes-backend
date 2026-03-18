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
}

export const anonymizeService = new AnonymizeService();
