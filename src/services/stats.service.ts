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

     async getUniversityStudentDistribution(uniEmployeeId: string) {
          const partnerships = await prisma.dualPartnership.findMany({
               where: {
                    uniEmployeeId: uniEmployeeId,
                    deletedAt: null,
                    status: PartnershipStatus.ACTIVE
               },
               include: {
                    student: {
                         include: {
                              major: true
                         }
                    },
                    position: {
                         include: {
                              company: true
                         }
                    }
               }
          });

          const statsMap: Record<string, { companyName: string; majors: Record<string, { majorName: string; count: number }> }> = {};

          partnerships.forEach(p => {
               const companyId = p.position?.companyId;
               const companyName = p.position?.company.name || "Ismeretlen cég";
               const majorId = p.student.majorId || "unknown_major";
               const majorName = p.student.major?.name || "Ismeretlen szak";

               if (!companyId) return;

               if (!statsMap[companyId]) {
                    statsMap[companyId] = {
                         companyName,
                         majors: {}
                    };
               }

               if (!statsMap[companyId].majors[majorId]) {
                    statsMap[companyId].majors[majorId] = {
                         majorName,
                         count: 0
                    };
               }

               statsMap[companyId].majors[majorId].count++;
          });

          // Formázás a kliens számára
          return Object.values(statsMap).map(companyStat => ({
               companyName: companyStat.companyName,
               majors: Object.values(companyStat.majors)
          }));
     }
     async getCompanyStats(companyId: string) {
          // Number of positions belonging to the company
          const positionCount = await prisma.position.count({
               where: { companyId, deletedAt: null }
          });

          // Number of active partnerships
          const activePartnerships = await prisma.dualPartnership.count({
               where: {
                    OR: [
                         { mentor: { companyId } },
                         { position: { companyId } }
                    ],
                    status: PartnershipStatus.ACTIVE,
                    deletedAt: null
               }
          });

          // Number of submitted applications for the company
          const applicationCount = await prisma.application.count({
               where: {
                    position: { companyId },
                    deletedAt: null
               }
          });

          // Applications by status for this company
          const byStatus = await prisma.application.groupBy({
               by: ['status'],
               where: {
                    position: { companyId },
                    deletedAt: null
               },
               _count: { _all: true }
          });

          // Number of employees
          const employeeCount = await prisma.companyEmployee.count({
               where: { companyId, deletedAt: null }
          });

          return {
               positions: positionCount,
               activePartnerships,
               applications: applicationCount,
               employees: employeeCount,
               applicationsByStatus: byStatus.map(s => ({
                    status: s.status,
                    count: s._count._all
               }))
          };
     }

     async getReferentOverview(referentId: string) {
          // 1. Get assignments for this referent
          const referent = await prisma.user.findUnique({
               where: { id: referentId },
               select: {
                    managedMajors: { select: { id: true, name: true } },
                    managedCompanies: { select: { id: true, name: true, description: true, website: true, logoUrl: true } }
               }
          });

          if (!referent) return null;

          const majorIds = referent.managedMajors.map(m => m.id);
          const companyIds = referent.managedCompanies.map(c => c.id);

          // 2. Get students (partnerships) at these companies with these majors, OR if directly assigned to this referent
          const partnerships = await prisma.dualPartnership.findMany({
               where: {
                    status: {
                         in: [
                              PartnershipStatus.ACTIVE,
                              PartnershipStatus.PENDING_MENTOR,
                              PartnershipStatus.PENDING_UNIVERSITY
                         ]
                    },
                    deletedAt: null,
                    OR: [
                         {
                              position: {
                                   companyId: { in: companyIds.length > 0 ? companyIds : ['____empty____'] }
                              },
                              student: {
                                   majorId: { in: majorIds.length > 0 ? majorIds : ['____empty____'] }
                              }
                         },
                         {
                              uniEmployeeId: referentId
                         }
                    ]
               },
               select: {
                    student: {
                         select: {
                              id: true,
                              majorId: true,
                              major: { select: { name: true } },
                              user: { select: { fullName: true, email: true } }
                         }
                    },
                    position: {
                         select: {
                              companyId: true,
                              company: { select: { id: true, name: true, description: true, website: true, logoUrl: true } }
                         }
                    }
               }
          });

          // 3. Aggregate data by company
          const companyStats: Record<string, any> = {};

          // Initialize with all managed companies even if no students
          referent.managedCompanies.forEach(c => {
               companyStats[c.id] = {
                    companyId: c.id,
                    companyName: c.name,
                    description: c.description,
                    website: c.website,
                    logoUrl: c.logoUrl,
                    studentsByMajor: {},
                    otherReferents: []
               };
          });

          const allRelevantCompanyIds = new Set(companyIds);

          partnerships.forEach(p => {
               const cId = p.position?.companyId;
               if (!cId) return;

               const mId = p.student.majorId || "unknown_major";
               const mName = p.student.major?.name || "Ismeretlen szak";

               if (!companyStats[cId]) {
                    const comp = p.position!.company;
                    companyStats[cId] = {
                         companyId: comp.id,
                         companyName: comp.name,
                         description: comp.description,
                         website: comp.website,
                         logoUrl: comp.logoUrl,
                         studentsByMajor: {},
                         otherReferents: []
                    };
               }

               allRelevantCompanyIds.add(cId);

               if (!companyStats[cId].studentsByMajor[mId]) {
                    companyStats[cId].studentsByMajor[mId] = {
                         majorName: mName,
                         count: 0,
                         students: []
                    };
               }

               companyStats[cId].studentsByMajor[mId].count++;
               companyStats[cId].studentsByMajor[mId].students.push({
                    name: p.student.user.fullName,
                    email: p.student.user.email
               });
          });

          // 4. Find other referents assigned to these companies
          const relevantCompanyIdsArray = Array.from(allRelevantCompanyIds);

          let allReferentsAtCompanies: any[] = [];
          if (relevantCompanyIdsArray.length > 0) {
               allReferentsAtCompanies = await prisma.user.findMany({
                    where: {
                         role: 'UNIVERSITY_USER',
                         managedCompanies: {
                              some: { id: { in: relevantCompanyIdsArray } }
                         },
                         NOT: { id: referentId }
                    },
                    select: {
                         id: true,
                         fullName: true,
                         email: true,
                         managedCompanies: { select: { id: true } }
                    }
               });
          }

          allReferentsAtCompanies.forEach(ref => {
               ref.managedCompanies.forEach((c: { id: string }) => {
                    if (companyStats[c.id]) {
                         companyStats[c.id].otherReferents.push({
                              id: ref.id,
                              fullName: ref.fullName,
                              email: ref.email
                         });
                    }
               });
          });

          return Object.values(companyStats).map((s: any) => ({
               ...s,
               studentsByMajor: Object.values(s.studentsByMajor)
          }));
     }
}
export const statsService = new StatsService();
