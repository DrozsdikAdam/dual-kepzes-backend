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

     async getApplicationStats() {
          const now = new Date();
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          // Státusz szerinti bontás
          const byStatus = await prisma.application.groupBy({
               by: ['status'],
               where: { deletedAt: null },
               _count: { _all: true }
          });

          // Összes és elfogadott jelentkezés a konverziós rátához
          const totalApplications = await prisma.application.count({ where: { deletedAt: null } });
          const acceptedApplications = await prisma.application.count({
               where: { deletedAt: null, status: 'ACCEPTED' }
          });

          // Átlagos jelentkezések pozíciónként
          const activePositions = await prisma.position.count({ where: { isActive: true, deletedAt: null } });
          const averagePerPosition = activePositions > 0
               ? Math.round((totalApplications / activePositions) * 100) / 100
               : 0;

          // Elmúlt 30 nap jelentkezései
          const lastMonthCount = await prisma.application.count({
               where: { deletedAt: null, submittedAt: { gte: lastMonth } }
          });

          return {
               byStatus: byStatus.map(s => ({ status: s.status, count: s._count._all })),
               conversionRate: totalApplications > 0
                    ? Math.round((acceptedApplications / totalApplications) * 10000) / 100
                    : 0,
               averagePerPosition,
               lastMonthCount
          };
     }

     async getPartnershipStats() {
          // Státusz szerinti bontás
          const byStatus = await prisma.dualPartnership.groupBy({
               by: ['status'],
               where: { deletedAt: null },
               _count: { _all: true }
          });

          // Félév szerinti bontás
          const bySemester = await prisma.dualPartnership.groupBy({
               by: ['semester'],
               where: { deletedAt: null },
               _count: { _all: true }
          });

          // Átlagos időtartam (csak befejezett partnerségek)
          const finishedPartnerships = await prisma.dualPartnership.findMany({
               where: {
                    deletedAt: null,
                    status: PartnershipStatus.FINISHED,
                    endDate: { not: null }
               },
               select: { startDate: true, endDate: true }
          });

          let averageDurationDays = 0;
          if (finishedPartnerships.length > 0) {
               const totalDays = finishedPartnerships.reduce((sum, p) => {
                    const duration = (p.endDate!.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + duration;
               }, 0);
               averageDurationDays = Math.round(totalDays / finishedPartnerships.length);
          }

          return {
               byStatus: byStatus.map(s => ({ status: s.status, count: s._count._all })),
               bySemester: bySemester.map(s => ({ semester: s.semester, count: s._count._all })),
               averageDurationDays
          };
     }
}
export const statsService = new StatsService();
