import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Adatbázis session időzóna: Europe/Budapest
// A connection string-ben az options paraméter biztosítja,
// hogy minden kapcsolat Budapest időzónát használjon (pgbouncer kompatibilis)
function appendTimezoneToUrl(envVar: string) {
    const url = process.env[envVar];
    if (url && !url.includes("options=")) {
        const separator = url.includes("?") ? "&" : "?";
        process.env[envVar] = `${url}${separator}options=-c%20timezone%3DEurope/Budapest`;
    }
}
appendTimezoneToUrl("DIRECT_URL");
appendTimezoneToUrl("DATABASE_URL");

const basePrisma = globalForPrisma.prisma || new PrismaClient();

const softDeleteModels = [
    "User", "StudentProfile", "CompanyEmployee", "Company",
    "Position", "Tag", "Application", "DualPartnership",
    "News", "Notification"
];

const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async findMany({ model, args, query }) {
                if (softDeleteModels.includes(model)) {
                    args.where = args.where || {};
                    if (!(args.where as any).deletedAt) {
                        (args.where as any).deletedAt = null;
                    }
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (softDeleteModels.includes(model)) {
                    args.where = args.where || {};
                    if (!(args.where as any).deletedAt) {
                        (args.where as any).deletedAt = null;
                    }
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (softDeleteModels.includes(model)) {
                    const modelName = model.charAt(0).toLowerCase() + model.slice(1);
                    const where = { ...args.where } as any;

                    // Handle composite unique keys (e.g. studentId_positionId)
                    // We need to flatten them because findFirst doesn't support the composite key name in where
                    for (const key in where) {
                        if (key.includes('_') && typeof where[key] === 'object' && where[key] !== null) {
                            const subKeys = where[key];
                            for (const subKey in subKeys) {
                                where[subKey] = subKeys[subKey];
                            }
                            delete where[key];
                        }
                    }

                    if (!where.deletedAt) {
                        where.deletedAt = null;
                    }

                    return (basePrisma as any)[modelName].findFirst({
                        ...args,
                        where
                    });
                }
                return query(args);
            }
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
export default prisma;