import { PrismaClient } from "@prisma/client";

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
            // A "model" paraméter tartalmazza a modell nevét (pl. "User", "Position")
            async findMany({ model, args, query }) {
                args.where = { ...args.where, deletedAt: null };
                return query(args);
            },
            async findFirst({ model, args, query }) {
                args.where = { ...args.where, deletedAt: null };
                return query(args);
            },
            async count({ model, args, query }) {
                args.where = { ...args.where, deletedAt: null };
                return query(args);
            },
            async findUnique({ model, args, query }) {
                return (basePrisma as any)[model].findFirst({
                    where: { ...args.where, deletedAt: null }
                });
            }
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export default prisma;