import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();

// Azok a modellek, amelyek rendelkeznek deletedAt mezővel a schema.prisma-ban
const softDeleteModels = [
    "User", "StudentProfile", "CompanyEmployee", "Company",
    "Position", "Tag", "Application", "DualPartnership",
    "Document", "LogbookEntry"
];

const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async findMany({ model, args, query }) {
                if (softDeleteModels.includes(model) && args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (softDeleteModels.includes(model) && args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (softDeleteModels.includes(model) && args.where && (args.where as any).deletedAt === undefined) {
                    // findUnique-nál findFirst-re váltunk a soft-delete miatt
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