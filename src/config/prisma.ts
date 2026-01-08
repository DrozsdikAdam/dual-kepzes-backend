import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });


const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async findMany({ model, operation, args, query }) {
                args.where = { ...args.where, deletedAt: null }
                return query(args)
            },
            async findFirst({ model, operation, args, query }) {
                args.where = { ...args.where, deletedAt: null }
                return query(args)
            },
            async count({ model, operation, args, query }) {
                args.where = { ...args.where, deletedAt: null }
                return query(args)
            },
            async findUnique({ args, query }) {
                // Itt nem a query(args)-t hívjuk meg közvetlenül a findUnique-ra,
                // hanem a findFirst-et kényszerítjük ki
                return (basePrisma as any)[(query as any).model].findFirst({
                    where: { ...args.where, deletedAt: null }
                });
            }
        }
    }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

export default prisma;