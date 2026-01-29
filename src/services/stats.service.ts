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

     async getPositionStats() {
          const now = new Date();
          const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          // 7 napon belül lejáró pozíciók
          const expiringIn7Days = await prisma.position.count({
               where: {
                    isActive: true,
                    deletedAt: null,
                    deadline: { gte: now, lte: in7Days }
               }
          });

          // Pozíciók tag-ek szerinti bontásban
          const positionsWithTags = await prisma.position.findMany({
               where: { isActive: true, deletedAt: null },
               include: { tags: true }
          });

          const tagCounts: Record<string, number> = {};
          positionsWithTags.forEach(pos => {
               pos.tags.forEach(tag => {
                    tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
               });
          });

          // Jelentkezés nélküli pozíciók
          const positionsWithApplications = await prisma.application.groupBy({
               by: ['positionId'],
               where: { deletedAt: null }
          });
          const positionIdsWithApps = new Set(positionsWithApplications.map(p => p.positionId));

          const allActivePositions = await prisma.position.findMany({
               where: { isActive: true, deletedAt: null },
               select: { id: true }
          });

          const withNoApplications = allActivePositions.filter(p => !positionIdsWithApps.has(p.id)).length;

          return {
               expiringIn7Days,
               withNoApplications
          };
     }

     async getTrendStats() {
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

          // Helper: get months array for the last 6 months
          const months: { start: Date; end: Date; label: string }[] = [];
          for (let i = 5; i >= 0; i--) {
               const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
               const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
               const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
               months.push({ start, end, label });
          }

          // Regisztrációk havonta
          const registrationsPerMonth = await Promise.all(
               months.map(async ({ start, end, label }) => {
                    const count = await prisma.user.count({
                         where: {
                              createdAt: { gte: start, lte: end },
                              deletedAt: null
                         }
                    });
                    return { month: label, count };
               })
          );

          // Jelentkezések havonta
          const applicationsPerMonth = await Promise.all(
               months.map(async ({ start, end, label }) => {
                    const count = await prisma.application.count({
                         where: {
                              submittedAt: { gte: start, lte: end },
                              deletedAt: null
                         }
                    });
                    return { month: label, count };
               })
          );

          // Partnerségek havonta
          const partnershipsPerMonth = await Promise.all(
               months.map(async ({ start, end, label }) => {
                    const count = await prisma.dualPartnership.count({
                         where: {
                              createdAt: { gte: start, lte: end },
                              deletedAt: null
                         }
                    });
                    return { month: label, count };
               })
          );

          return {
               registrationsPerMonth,
               applicationsPerMonth,
               partnershipsPerMonth
          };
     }
}
export const statsService = new StatsService();
