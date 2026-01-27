import prisma from '../config/prisma';
import { PartnershipStatus } from '@prisma/client';

export class StatsService {
     async getSystemStats() {
          // Sequential execution to prevent DB connection pool exhaustion
          const userCount = await prisma.user.count({ where: { isActive: true, deletedAt: null } });
          const companyCount = await prisma.company.count({ where: { isActive: true, deletedAt: null } });
          const positionCount = await prisma.position.count({ where: { isActive: true, deletedAt: null } });
          const applicationCount = await prisma.application.count({ where: { deletedAt: null } });
          const newsCount = await prisma.news.count({ where: { deletedAt: null, isArchived: false } });
          const archivedNewsCount = await prisma.news.count({ where: { deletedAt: null, isArchived: true } });
          const usersByRole = await prisma.user.groupBy({
               by: ["role"],
               where: { isActive: true, deletedAt: null },
               _count: { _all: true }
          });
          const activePartnerships = await prisma.dualPartnership.count({ where: { status: PartnershipStatus.ACTIVE } });

          return {
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
          };
     }
}

export const statsService = new StatsService();
