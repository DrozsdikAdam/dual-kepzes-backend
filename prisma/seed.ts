// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Alapértelmezett jelszó a seed adatokhoz
const DEFAULT_PASSWORD = 'TesztJelszo123!'

async function main() {
    console.log('🌱 Seed adatok betöltése...')

    // Jelszó hashelése
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // 1. SYSTEM ADMIN
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
    })
    console.log(`👤 System Admin létrehozva: ${sysAdmin.email}`)

    // 2. UNIVERSITY USER
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
    })
    console.log(`👤 University User létrehozva: ${uniUser.email}`)

    // 3. STUDENT (teljes profil adatokkal)
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
                    birthDate: new Date('2000-01-01'),
                    locations: {
                        create: {
                            country: 'Magyarország',
                            zipCode: '4028',
                            city: 'Debrecen',
                            address: 'Kassai út 26.',
                        }
                    },
                    highSchool: 'Tóth Árpád Gimnázium',
                    graduationYear: 2019,
                    neptunCode: 'ABC123',
                    currentMajor: 'Mérnökinformatikus BSc',
                    studyMode: 'NAPPALI',
                    hasLanguageCert: true,
                },
            },
        },
    })
    console.log(`👤 Student létrehozva: ${studentUser.email}`)

    console.log(`\n🔐 Belépési jelszó mindenkihez: ${DEFAULT_PASSWORD}`)
    console.log('✅ Seed befejezve.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
