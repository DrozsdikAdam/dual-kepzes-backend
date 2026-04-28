import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();

const softDeleteModels = [
    "User", "StudentProfile", "CompanyEmployee", "Company",
    "Position", "Tag", "Application", "DualPartnership",
    "News", "Notification"
];

function shouldApplySoftDeleteFilter(model: string) {
    return softDeleteModels.includes(model);
}

function ensureSoftDeleteFilter(args: { where?: Record<string, unknown> }) {
    args.where = args.where || {};

    if ((args.where as Record<string, unknown>).deletedAt === undefined) {
        (args.where as Record<string, unknown>).deletedAt = null;
    }
}

const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async findMany({ model, args, query }) {
                if (shouldApplySoftDeleteFilter(model)) {
                    ensureSoftDeleteFilter(args as { where?: Record<string, unknown> });
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (shouldApplySoftDeleteFilter(model)) {
                    ensureSoftDeleteFilter(args as { where?: Record<string, unknown> });
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (!shouldApplySoftDeleteFilter(model)) {
                    return query(args);
                }

                const result = await query(args);

                if (result && typeof result === "object" && "deletedAt" in result) {
                    return (result as { deletedAt: Date | null }).deletedAt === null
                        ? result
                        : null;
                }

                return result;
            }
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
export default prisma;
