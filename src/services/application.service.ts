import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { ApplicationStatus, PartnershipStatus } from '@prisma/client';
import { getCompanyIdForUser } from '../utils/company.util';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';
import { getCurrentSemester } from '../utils/semester.util';
import { validateApplicationTransition } from '../utils/status-transition.util';

export class ApplicationService {
     async apply(studentId: string, positionId: string) {
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

          // Státusz átmenet validálása
          validateApplicationTransition(application.status, ApplicationStatus.RETRACTED);

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
          // Prevent updating restricted fields
          const { studentId, positionId, id: _, ...rest } = data;

          return await prisma.application.update({
               where: { id },
               data: rest,
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

          // Státusz átmenet validálása
          validateApplicationTransition(application.status, status);

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
                              semester: getCurrentSemester(),
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
               position: {
                    include: {
                         company: {
                              select: {
                                   id: true,
                                   name: true,
                                   logoUrl: true
                              }
                         },
                         location: true
                    }
               }
          };
     }
}

export const applicationService = new ApplicationService();
