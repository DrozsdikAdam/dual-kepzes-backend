import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();

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
                    args.where = { ...args.where, deletedAt: null } as any;
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (softDeleteModels.includes(model) && args.where && (args.where as any).deletedAt === undefined) {
                    args.where = { ...args.where, deletedAt: null } as any;
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (softDeleteModels.includes(model) && args.where && (args.where as any).deletedAt === undefined) {
                    // JAVÍTVA: Modellnév camelCase-re alakítása az eléréshez
                    const modelName = model.charAt(0).toLowerCase() + model.slice(1);
                    return (basePrisma as any)[modelName].findFirst({
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