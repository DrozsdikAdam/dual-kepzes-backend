// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Kezdőadatok betöltése...')

    // 3. Egy teszt cég létrehozása
    const testCompany = await prisma.company.upsert({
        where: { taxId: '12345678-1-42' },
        update: {},
        create: {
            name: 'Minta Kft.',
            taxId: '12345678-1-42',
            hqCountry: 'Magyarország',
            hqCity: 'Debrecen',
            hqZipCode: '4025',
            hqAddress: 'Piac utca 1.',
            contactName: 'Minta János',
            contactEmail: 'info@mintakft.hu',
        }
    })

    console.log('✅ Feltöltés kész.')
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