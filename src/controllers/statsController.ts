import { Request, Response } from "express"
import prisma from "../config/prisma"

export const getSystemStats = async (req: Request, res: Response) => {

    try {
        const [
            userCount,
            companyCount,
            positionCount,
            applicationCount,
            newsCount,
            archivedNewsCount,
            usersByRole,
            activePartnerships
        ] = await Promise.all([
            prisma.user.count({ where: { isActive: true, deletedAt: null } }),
            prisma.company.count({ where: { isActive: true, deletedAt: null } }),
            prisma.position.count({ where: { isActive: true, deletedAt: null } }),
            prisma.application.count({ where: { deletedAt: null } }),
            prisma.news.count({ where: { deletedAt: null, isArchived: false } }),
            prisma.news.count({ where: { deletedAt: null, isArchived: true } }),
            prisma.user.groupBy({
                by: ["role"],
                where: { isActive: true, deletedAt: null },
                _count: { _all: true }
            }),
            prisma.dualPartnership.count({ where: { status: "ACTIVE" } })
        ])

        res.json({
            totals: {
                users: userCount,
                companies: companyCount,
                positions: positionCount,
                applications: applicationCount,
                activePartnerships: activePartnerships,
                news: newsCount,
                archivedNews: archivedNewsCount
            },
            usersByRole: usersByRole.map(stat => ({
                role: stat.role,
                count: stat._count._all
            }))
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Hiba a statisztikák generálásakor." });
    }
}