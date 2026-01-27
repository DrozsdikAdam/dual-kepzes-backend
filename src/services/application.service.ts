import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { ApplicationStatus, PartnershipStatus } from '@prisma/client';
import { getCompanyIdForUser } from '../utils/companyUtils';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination';

export class ApplicationService {
     async apply(studentId: string, positionId: string, studentNote?: string) {
          // Check if position exists and is active
          const position = await prisma.position.findUnique({
               where: { id: positionId }
          });

          if (!position || !position.isActive) {
               throw new NotFoundError('Pozíció');
          }

          // Check if already applied
          const existing = await prisma.application.findUnique({
               where: {
                    studentId_positionId: {
                         studentId,
                         positionId
                    }
               }
          });

          if (existing) {
               throw new BadRequestError('Már jelentkeztél erre a pozícióra.');
          }

          return await prisma.application.create({
               data: {
                    studentId,
                    positionId,
                    studentNote,
                    status: ApplicationStatus.SUBMITTED
               },
               include: this.getApplicationInclude()
          });
     }

     async getMyApplications(studentId: string, params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = { studentId };

          return await paginate(
               params,
               prisma.application.findMany({
                    where,
                    include: this.getApplicationInclude(),
                    orderBy: { submittedAt: 'desc' as const },
                    skip,
                    take
               }),
               prisma.application.count({ where })
          );
     }

     async retract(applicationId: string, studentId: string) {
          const application = await prisma.application.findFirst({
               where: { id: applicationId, studentId }
          });

          if (!application) {
               throw new NotFoundError('Jelentkezés');
          }

          return await prisma.application.update({
               where: { id: applicationId },
               data: { status: ApplicationStatus.RETRACTED },
               include: this.getApplicationInclude()
          });
     }

     async getById(id: string) {
          const application = await prisma.application.findUnique({
               where: { id },
               include: this.getApplicationInclude()
          });

          if (!application) {
               throw new NotFoundError('Jelentkezés');
          }

          return application;
     }

     async update(id: string, data: any) {
          return await prisma.application.update({
               where: { id },
               data,
               include: this.getApplicationInclude()
          });
     }

     async evaluate(applicationId: string, userId: string, status: ApplicationStatus, companyNote?: string) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs jogosultsága a művelethez.');
          }

          const application = await prisma.application.findFirst({
               where: {
                    id: applicationId,
                    position: { companyId }
               }
          });

          if (!application) {
               throw new NotFoundError('Jelentkezés');
          }

          return await prisma.$transaction(async (tx) => {
               const updatedApp = await tx.application.update({
                    where: { id: applicationId },
                    data: { status, companyNote },
                    include: this.getApplicationInclude()
               });

               // If accepted, create a dual partnership
               if (status === ApplicationStatus.ACCEPTED) {
                    await tx.dualPartnership.create({
                         data: {
                              studentId: application.studentId,
                              positionId: application.positionId,
                              status: PartnershipStatus.PENDING_MENTOR,
                              semester: '2023/24/2', // This should ideally be dynamic or passed from request
                              startDate: new Date(),
                         }
                    });
               }

               return updatedApp;
          });
     }

     async getCompanyApplications(userId: string, params: Required<PaginationParams>) {
          const companyId = await getCompanyIdForUser(userId);
          if (!companyId) {
               throw new ForbiddenError('Nincs jogosultsága a művelethez.');
          }

          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               position: { companyId }
          };

          return await paginate(
               params,
               prisma.application.findMany({
                    where,
                    include: this.getApplicationInclude(),
                    orderBy: { submittedAt: 'desc' as const },
                    skip,
                    take
               }),
               prisma.application.count({ where })
          );
     }

     async getAll(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {};

          return await paginate(
               params,
               prisma.application.findMany({
                    where,
                    include: this.getApplicationInclude(),
                    orderBy: { submittedAt: 'desc' as const },
                    skip,
                    take
               }),
               prisma.application.count({ where })
          );
     }

     private getApplicationInclude() {
          return {
               student: {
                    include: {
                         user: {
                              select: {
                                   email: true,
                                   fullName: true,
                                   phoneNumber: true
                              }
                         }
                    }
               },
               position: {
                    include: {
                         company: {
                              select: {
                                   id: true,
                                   name: true,
                                   logoUrl: true
                              }
                         }
                    }
               }
          };
     }
}

export const applicationService = new ApplicationService();
