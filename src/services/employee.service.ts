import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { Role } from '@prisma/client';

export class EmployeeService {
     private employeeProfileSelect = {
          id: true,
          jobTitle: true,
          companyId: true,
          user: {
               select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    isActive: true
               }
          }
     };

     private dualPartnershipSelect = {
          id: true,
          status: true,
          contractNumber: true,
          startDate: true,
          endDate: true,
          student: {
               select: {
                    id: true,
                    neptunCode: true,
                    currentMajor: true,
                    studyMode: true,
                    user: {
                         select: {
                              fullName: true,
                              email: true,
                              phoneNumber: true
                         }
                    }
               }
          },
          uniEmployee: {
               select: {
                    fullName: true,
                    email: true
               }
          }
     };

     async getProfile(userId: string) {
          const employee = await prisma.companyEmployee.findUnique({
               where: { userId },
               select: this.employeeProfileSelect
          });

          if (!employee) {
               throw new NotFoundError('Munkavállalói profil');
          }

          return employee;
     }

     async getMentorStudents(userId: string) {
          const mentorProfile = await prisma.companyEmployee.findUnique({
               where: { userId },
               select: { id: true }
          });

          if (!mentorProfile) {
               throw new NotFoundError('Mentor profil');
          }

          return await prisma.dualPartnership.findMany({
               where: {
                    mentorId: mentorProfile.id,
               },
               select: this.dualPartnershipSelect,
               orderBy: {
                    startDate: "desc"
               }
          });
     }

     async getMentorPartnership(userId: string, partnershipId: string) {
          const mentorProfile = await prisma.companyEmployee.findUnique({
               where: { userId },
               select: { id: true }
          });

          if (!mentorProfile) {
               throw new NotFoundError('Mentor profil');
          }

          const partnership = await prisma.dualPartnership.findFirst({
               where: { mentorId: mentorProfile.id, id: partnershipId },
               select: this.dualPartnershipSelect
          });

          if (!partnership) {
               throw new NotFoundError('Partnerség');
          }

          return partnership;
     }
}

export const employeeService = new EmployeeService();
