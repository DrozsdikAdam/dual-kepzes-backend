// prisma/seed-users.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Egységes jelszó minden teszt usernek (megfelel a Zod regexnek!)
// Kisbetű, Nagybetű, Szám, Spec karakter, min 12 hossz.
const TEST_PASSWORD_RAW = "TesztJelszo123!";

async function main() {
    console.log('🚀 Teszt adatok generálása indítása...');

    // 1. Jelszó hashelése
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD_RAW, 10);

    // 2. Alapértelmezett Cég létrehozása (vagy keresése)
    const company = await prisma.company.upsert({
        where: { taxId: '12345678-1-42' },
        update: {},
        create: {
            name: 'Minta Kft.',
            taxId: '12345678-1-42',
            hqCountry: 'Magyarország',
            hqCity: 'Budapest',
            hqZipCode: '1117',
            hqAddress: 'Irinyi József utca 42.',
            contactName: 'Kovács Cégvezető',
            contactEmail: 'info@mintakft.hu',
        },
    });

    console.log(`🏢 Cég beállítva: ${company.name} (ID: ${company.id})`);

    // --- FELHASZNÁLÓK LÉTREHOZÁSA ---

    // 3. SYSTEM ADMIN
    const sysAdmin = await prisma.user.upsert({
        where: { email: 'admin@system.com' },
        update: {},
        create: {
            email: 'admin@system.com',
            password: hashedPassword,
            fullName: 'Rendszer Adminisztrátor',
            phoneNumber: '+36301111111',
            role: 'SYSTEM_ADMIN',
        },
    });
    console.log(`👤 System Admin létrehozva: ${sysAdmin.email}`);

    // 4. UNIVERSITY USER
    const uniUser = await prisma.user.upsert({
        where: { email: 'uni@university.com' },
        update: {},
        create: {
            email: 'uni@university.com',
            password: hashedPassword,
            fullName: 'Egyetemi Koordinátor',
            phoneNumber: '+36302222222',
            role: 'UNIVERSITY_USER',
        },
    });
    console.log(`👤 University User létrehozva: ${uniUser.email}`);

    // 5. COMPANY ADMIN (Minta Kft-hez kötve)
    const compAdminUser = await prisma.user.upsert({
        where: { email: 'admin@mintakft.hu' },
        update: {},
        create: {
            email: 'admin@mintakft.hu',
            password: hashedPassword,
            fullName: 'Minta Kft Admin',
            phoneNumber: '+36303333333',
            role: 'COMPANY_ADMIN',
            // Kapcsoljuk a CompanyEmployee táblát
            companyEmployee: {
                create: {
                    companyId: company.id,
                    jobTitle: 'HR Igazgató',
                },
            },
        },
    });
    console.log(`👤 Company Admin létrehozva: ${compAdminUser.email}`);

    // 6. MENTOR (Minta Kft-hez kötve)
    const mentorUser = await prisma.user.upsert({
        where: { email: 'mentor@mintakft.hu' },
        update: {},
        create: {
            email: 'mentor@mintakft.hu',
            password: hashedPassword,
            fullName: 'Minta Mentor',
            phoneNumber: '+36304444444',
            role: 'MENTOR',
            companyEmployee: {
                create: {
                    companyId: company.id,
                    jobTitle: 'Senior Java Fejlesztő',
                },
            },
        },
    });
    console.log(`👤 Mentor létrehozva: ${mentorUser.email}`);

    // 7. STUDENT (Diák profil adatokkal)
    const studentUser = await prisma.user.upsert({
        where: { email: 'diak@student.com' },
        update: {},
        create: {
            email: 'diak@student.com',
            password: hashedPassword,
            fullName: 'Példa Diák',
            phoneNumber: '+36305555555',
            role: 'STUDENT',
            studentProfile: {
                create: {
                    mothersName: 'Példa Anya',
                    birthDate: new Date('2000-01-01'), // 18+ éves
                    country: 'Magyarország',
                    zipCode: '4028',
                    city: 'Debrecen',
                    streetAddress: 'Kassai út 26.',
                    highSchool: 'Tóth Árpád Gimnázium',
                    graduationYear: 2019,
                    neptunCode: 'ABC123', // Pontosan 6 karakter
                    currentMajor: 'Mérnökinformatikus BSc',
                    studyMode: 'NAPPALI',
                    hasLanguageCert: true,
                },
            },
        },
    });
    console.log(`👤 Student létrehozva: ${studentUser.email}`);

    console.log('✅ Minden felhasználó sikeresen létrehozva!');
    console.log(`🔐 Belépési jelszó mindenkihez: ${TEST_PASSWORD_RAW}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });