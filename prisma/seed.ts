// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Alapértelmezett jelszó a seed adatokhoz
const DEFAULT_PASSWORD = 'IdeiglenesJelszo123!'

// Szakok definíciója - ahol magyar/angol van, ott 2 rekord jön létre
const majorsData = [
    // Műszaki képzések
    { name: 'gépészmérnöki BSc', languages: ['magyar', 'angol'] },
    { name: 'gépészmérnöki MSc', languages: ['magyar'] },
    { name: 'villamosmérnöki', languages: ['magyar'] },
    { name: 'járműmérnöki', languages: ['magyar', 'angol'] },
    { name: 'mérnökinformatikus', languages: ['magyar', 'angol'] },
    { name: 'üzemmérnök-inf. Bprof', languages: ['magyar'] },
    { name: 'logisztikai mérnöki', languages: ['magyar'] },

    // Gazdasági képzések
    { name: 'gazdálkodási és menedzsment', languages: ['magyar', 'angol'] },
    { name: 'pénzügy és számvitel', languages: ['magyar'] },
    { name: 'nemzetközi gazdálkodás', languages: ['magyar'] },
    { name: 'turizmus-vendéglátás', languages: ['magyar'] },
    { name: 'kereskedelem és marketing', languages: ['magyar'] },

    // Agrár képzések
    { name: 'gazdasági és vidékfejlesztési agrármérnöki', languages: ['magyar'] },
    { name: 'kertészmérnöki', languages: ['magyar'] },
    { name: 'mezőgazdasági mérnöki', languages: ['magyar'] },
]

async function seedMajors() {
    console.log('\n Major (szak) adatok betöltése...')

    let createdCount = 0
    for (const major of majorsData) {
        for (const language of major.languages) {
            const existing = await prisma.major.findFirst({
                where: { name: major.name, language: language },
            })

            if (!existing) {
                await prisma.major.create({
                    data: { name: major.name, language: language },
                })
                createdCount++
                console.log(`   ✅ ${major.name} (${language})`)
            }
        }
    }
    console.log(`🎓 Szakok létrehozva: ${createdCount} db`)
}

async function main() {
    console.log('🌱 Seed adatok betöltése...')

    // Jelszó hashelése
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // 1. ELŐSZÖR: MAJORS (SZAKOK) - ezekre hivatkozik a hallgató profil
    await seedMajors()

    // 2. University Users betöltése
    const uniUsers = [
        { fullName: "Vincze Imre", email: "vincze.imre@nje.hu" },
        { fullName: "Vajda Zsuzsanna", email: "vajda.zsuzsanna@nje.hu" },
        { fullName: "Ivánovics Gergely", email: "ivanovics.gergely@nje.hu" },
        { fullName: "Papp Klaudia", email: "papp.klaudia@nje.hu" },
        { fullName: "Király Ildikó", email: "kiraly.ildiko@nje.hu" },
        { fullName: "Borzák Nikolett", email: "borzak.nikolett@nje.hu" },
        { fullName: "Suba Edina", email: "suba.edina@nje.hu" },
        { fullName: "Boldizsár Adrienn", email: "boldizsar.adrienn@nje.hu" },
        { fullName: "Sári Bence", email: "sribence@gmail.com" }
    ];

    console.log('\n University Userek betöltése...');
    for (const user of uniUsers) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                email: user.email,
                password: hashedPassword,
                fullName: user.fullName,
                phoneNumber: '+36300000000',
                role: 'UNIVERSITY_USER',
                isEmailVerified: true
            },
        })
        console.log(`   ✅ ${user.fullName} (${user.email})`)
    }

    // 3. System Admins betöltése
    const systemAdmins = [
        { fullName: "Angeli Eliza", email: "angeli.eliza@nje.hu" },
        { fullName: "Palotai Bernadett", email: "palotai.bernadett@nje.hu" },
        { fullName: "Sári Bence", email: "sari.bence@nje.hu" }
    ];

    console.log('\n👤 System Adminok betöltése...');
    for (const user of systemAdmins) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                email: user.email,
                password: hashedPassword,
                fullName: user.fullName,
                phoneNumber: '+36300000000',
                role: 'SYSTEM_ADMIN',
                isEmailVerified: true
            },
        })
        console.log(`   ✅ ${user.fullName} (${user.email})`)
    }

    console.log(`\n Belépési jelszó mindenkihez: ${DEFAULT_PASSWORD}`);
    console.log(' Seed befejezve.')
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
