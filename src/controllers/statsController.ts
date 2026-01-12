import { Request, Response } from 'express'
import prisma from '../config/prisma'

export const getSystemStats = async (req: Request, res: Response) => {

    try {
        const [
            userCount,
            companyCount,
            positionCount,
            applicationCount,
            usersByRole,
            activePartnerships
        ] = await Promise.all([
            prisma.user.count(),
            prisma.company.count({ where: { isActive: true } }),
            prisma.position.count({ where: { isActive: true } }),
            prisma.application.count(),
            prisma.user.groupBy({
                by: ["role"],
                _count: { _all: true, isActive: true }
            }),
            prisma.dualPartnership.count({ where: { status: "ACTIVE" } })
        ])

        res.json({
            totals: {
                users: userCount,
                companies: companyCount,
                positions: positionCount,
                applications: applicationCount,
                activePartnerships: activePartnerships
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