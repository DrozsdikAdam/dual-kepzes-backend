import { PrismaClient } from '@prisma/client';

// Globális változó deklarálása, hogy ne vesszen el újrafordításkor (development módban)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'], // Opcionális: segít látni, mit csinál
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;