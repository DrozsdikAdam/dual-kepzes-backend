import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { ApplicationStatus, PartnershipStatus, Role } from '@prisma/client';
import { getCompanyIdForUser } from '../utils/company.util';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';
import { getCurrentSemester } from '../utils/semester.util';
import { validateApplicationTransition } from '../utils/status-transition.util';
import { notificationService } from './notification.service';
import { NOTIFICATION_TYPES } from '../utils/constants';

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

          const application = await prisma.application.create({
               data: {
                    studentId,
                    positionId,
                    status: ApplicationStatus.SUBMITTED
               },
               include: this.getApplicationInclude()
          });

          // Background notification
          this.notifyCompanyAdminsOfNewApplication(application).catch(err =>
               console.error('[ApplicationService.apply] Notification error:', err)
          );

          return application;
     }

     private async notifyCompanyAdminsOfNewApplication(application: any) {
          const companyAdmins = await prisma.user.findMany({
               where: {
                    role: Role.COMPANY_ADMIN,
                    companyEmployee: {
                         companyId: application.position.company.id
                    }
               },
               select: { id: true }
          });

          const notifications = companyAdmins.map(admin =>
               notificationService.create({
                    userId: admin.id,
                    title: "Új jelentkezés érkezett",
                    message: `Új jelentkezés érkezett a(z) ${application.position.title ?? 'pozíció'} pozícióra: ${application.student.user.fullName}`,
                    type: NOTIFICATION_TYPES.NEW_APPLICATION
               })
          );

          await Promise.all(notifications);
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

          const result = await prisma.$transaction(async (tx) => {
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

          // Background notification to student
          this.notifyStudentOfEvaluation(result, status).catch(err =>
               console.error('[ApplicationService.evaluate] Notification error:', err)
          );

          return result;
     }

     private async notifyStudentOfEvaluation(application: any, status: ApplicationStatus) {
          const typeMap: Record<string, string> = {
               [ApplicationStatus.ACCEPTED]: NOTIFICATION_TYPES.APPLICATION_ACCEPTED,
               [ApplicationStatus.REJECTED]: NOTIFICATION_TYPES.APPLICATION_REJECTED,
               [ApplicationStatus.NO_RESPONSE]: NOTIFICATION_TYPES.APPLICATION_NO_RESPONSE,
               [ApplicationStatus.SUBMITTED]: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
               [ApplicationStatus.RETRACTED]: NOTIFICATION_TYPES.APPLICATION_RETRACTED
          };

          const titleMap: Record<string, string> = {
               [ApplicationStatus.ACCEPTED]: "Jelentkezésed elfogadva!",
               [ApplicationStatus.REJECTED]: "Jelentkezésed elutasítva",
               [ApplicationStatus.NO_RESPONSE]: "Jelentkezésedre nem érkezett válasz.",
               [ApplicationStatus.SUBMITTED]: "Jelentkezésed beérkezett",
               [ApplicationStatus.RETRACTED]: "Jelentkezésed visszavonva"
          };

          const type = typeMap[status];
          const title = titleMap[status];

          if (type && title) {
               await notificationService.create({
                    userId: application.student.userId,
                    title,
                    message: `A(z) ${application.position.company.name} cégnél a(z) ${application.position.title ?? 'pozíció'} pozícióra beadott jelentkezésed státusza: ${status}`,
                    type
               });
          }
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
