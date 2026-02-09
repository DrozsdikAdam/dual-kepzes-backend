import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { PartnershipStatus, ApplicationStatus } from '@prisma/client';
import { getCompanyIdForUser } from '../utils/company.util';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';
import { validatePartnershipTransition } from '../utils/status-transition.util';

export class PartnershipService {
     async getById(partnershipId: string, userId: string) {
          const companyId = await getCompanyIdForUser(userId);

          const partnership = await prisma.dualPartnership.findFirst({
               where: {
                    id: partnershipId,
                    ...(companyId && {
                         OR: [
                              { mentor: { companyId } },
                              { position: { companyId } }
                         ]
                    })
               },
               select: this.getPartnershipSelect()
          });

          if (!partnership) {
               // If not found with company scope, check if student
               const studentProfile = await prisma.studentProfile.findUnique({
                    where: { userId }
               });

               if (studentProfile) {
                    const studentPartnership = await prisma.dualPartnership.findFirst({
                         where: { id: partnershipId, studentId: studentProfile.id },
                         select: this.getPartnershipSelect()
                    });

                    if (!studentPartnership) {
                         throw new NotFoundError('Partneri kapcsolat');
                    }

                    return studentPartnership;
               }
               throw new NotFoundError('Partneri kapcsolat');
          }

          return partnership;
     }

     async update(id: string, userId: string, data: any) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs jogosultsága partnerséget frissíteni.');
          }

          const partnershipToUpdate = await prisma.dualPartnership.findFirst({
               where: {
                    id,
                    OR: [
                         { mentor: { companyId } },
                         { position: { companyId } }
                    ]
               }
          });

          if (!partnershipToUpdate) {
               throw new NotFoundError('Partneri kapcsolat');
          }

          const { id: _, studentId: __, positionId: ___, ...updateData } = data;

          return await prisma.dualPartnership.update({
               where: { id },
               data: updateData,
               select: this.getPartnershipSelect()
          });
     }

     async delete(id: string, userId: string) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs jogosultsága partnerséget törölni.');
          }

          const result = await prisma.dualPartnership.updateMany({
               where: {
                    id,
                    OR: [
                         { mentor: { companyId } },
                         { position: { companyId } }
                    ]
               },
               data: { deletedAt: new Date() }
          });

          if (result.count === 0) {
               throw new NotFoundError('Partneri kapcsolat');
          }

          return true;
     }

     async terminate(partnershipId: string, userId: string) {
          const partnership = await prisma.dualPartnership.findUnique({
               where: { id: partnershipId }
          });

          if (!partnership) {
               throw new NotFoundError('Partneri kapcsolat');
          }

          // 🛡️ Never Trust The Client: Státusz átmenet validálása
          validatePartnershipTransition(partnership.status, PartnershipStatus.TERMINATED);

          return await prisma.dualPartnership.update({
               where: { id: partnershipId },
               data: { status: PartnershipStatus.TERMINATED },
               select: this.getPartnershipSelect()
          });
     }

     async assignMentor(
          partnershipId: string,
          mentorId: string,
          userId: string
     ) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs jogosultsága mentort hozzárendelni.');
          }

          const partnership = await prisma.dualPartnership.findFirst({
               where: { id: partnershipId },
               select: { status: true, studentId: true }
          });

          if (!partnership) {
               throw new NotFoundError('Partneri kapcsolat');
          }

          // 🛡️ Never Trust The Client: Státusz átmenet validálása
          validatePartnershipTransition(partnership.status, PartnershipStatus.PENDING_UNIVERSITY);

          // Verify partnership belongs to company
          const validApplication = await prisma.application.findFirst({
               where: {
                    studentId: partnership.studentId,
                    status: ApplicationStatus.ACCEPTED,
                    position: { companyId }
               }
          });

          if (!validApplication) {
               throw new ForbiddenError('Ez a partnerség nem a te cégedhez tartozik.');
          }

          // Resolve mentor ID (handle both employee ID and user ID)
          const finalMentorId = await this.resolveMentorId(mentorId, companyId);

          return await prisma.dualPartnership.update({
               where: { id: partnershipId },
               data: {
                    mentorId: finalMentorId,
                    status: PartnershipStatus.PENDING_UNIVERSITY
               },
               select: this.getPartnershipSelect()
          });
     }

     async assignUniversityUser(id: string, uniEmployeeId: string, userId: string) {
          const partnership = await prisma.dualPartnership.findUnique({
               where: { id }
          });

          if (!partnership) {
               throw new NotFoundError('Partneri kapcsolat');
          }

          // 🛡️ Never Trust The Client: Státusz átmenet validálása
          validatePartnershipTransition(partnership.status, PartnershipStatus.ACTIVE);

          return await prisma.dualPartnership.update({
               where: { id },
               data: {
                    uniEmployeeId: uniEmployeeId,
                    status: PartnershipStatus.ACTIVE
               },
               select: this.getPartnershipSelect()
          });
     }

     async getStudentPartnerships(userId: string, params: Required<PaginationParams>) {
          const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
          if (!studentProfile) {
               throw new NotFoundError('Hallgatói profil');
          }

          const { skip, take } = getPrismaSkipTake(params);
          const where = { studentId: studentProfile.id };

          return await paginate(
               params,
               prisma.dualPartnership.findMany({
                    where,
                    select: this.getPartnershipSelect(),
                    orderBy: { createdAt: "desc" as const },
                    skip,
                    take
               }),
               prisma.dualPartnership.count({ where })
          );
     }

     async getCompanyPartnerships(userId: string, params: Required<PaginationParams>) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs céghez rendelve vagy nincs jogosultsága.');
          }

          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               OR: [
                    { mentor: { companyId } },
                    { position: { companyId } }
               ]
          };

          return await paginate(
               params,
               prisma.dualPartnership.findMany({
                    where,
                    select: this.getPartnershipSelect(),
                    orderBy: { createdAt: "desc" as const },
                    skip,
                    take
               }),
               prisma.dualPartnership.count({ where })
          );
     }

     async getUniversityPartnerships(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {}; // Add University filters if needed (e.g. non-deleted)

          return await paginate(
               params,
               prisma.dualPartnership.findMany({
                    where,
                    select: this.getPartnershipSelect(),
                    orderBy: { createdAt: "desc" as const },
                    skip,
                    take
               }),
               prisma.dualPartnership.count({ where })
          );
     }

     private async resolveMentorId(
          mentorId: string,
          companyId: string
     ): Promise<string> {
          // Try by employee ID first
          const employeeById = await prisma.companyEmployee.findUnique({
               where: { id: mentorId }
          });

          if (employeeById) {
               if (employeeById.companyId !== companyId) {
                    throw new ForbiddenError('A megadott mentor nem ehhez a céghez tartozik.');
               }
               return employeeById.id;
          }

          // Try by user ID
          const employeeByUserId = await prisma.companyEmployee.findUnique({
               where: { userId: mentorId }
          });

          if (employeeByUserId && employeeByUserId.companyId === companyId) {
               return employeeByUserId.id;
          }

          throw new NotFoundError('Mentor');
     }

     private getPartnershipSelect() {
          return {
               id: true,
               semester: true,
               contractNumber: true,
               status: true,
               startDate: true,
               endDate: true,
               studentId: true,
               mentorId: true,
               uniEmployeeId: true,
               positionId: true,
               student: {
                    select: {
                         id: true,
                         userId: true,
                         user: {
                              select: {
                                   email: true,
                                   fullName: true,
                                   phoneNumber: true,
                                   role: true,
                                   isActive: true
                              }
                         },
                         mothersName: true,
                         birthDate: true,
                         highSchool: true,
                         graduationYear: true,
                         neptunCode: true,
                         studyMode: true,
                         hasLanguageCert: true,
                         locations: true
                    }
               },
               mentor: {
                    select: {
                         userId: true,
                         companyId: true,
                         user: { select: { email: true, fullName: true } },
                         company: { select: { id: true, name: true } },
                         jobTitle: true,
                    }
               },
               position: {
                    select: {
                         id: true,
                         title: true,
                         companyId: true,
                         company: { select: { name: true } }
                    }
               },
               uniEmployee: {
                    select: {
                         id: true,
                         email: true,
                         fullName: true,
                    }
               },
               createdAt: true,
               updatedAt: true,
          };
     }
}

export const partnershipService = new PartnershipService();
