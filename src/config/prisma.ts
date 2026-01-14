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
            async findMany({ args, query }) {
                if (args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null } as any;
                }
                return query(args);
            },

            async findFirst({ args, query }) {
                if (args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null } as any;
                }
                return query(args);
            },

            async count({ args, query }) {
                if (args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null } as any;
                }
                return query(args);
            },


            async findUnique({ model, args, query }) {
                if (args.where && (args.where as any).deletedAt === undefined) {
                    return (basePrisma as any)[model].findFirst({
                        where: { ...args.where, deletedAt: null }
                    });
                }
                return query(args);
            }
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export default prisma;