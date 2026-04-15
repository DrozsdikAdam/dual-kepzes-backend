import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { Role } from '@prisma/client';

export class UniversityUserService {
     async getReferentAssignments(userId: string) {
          const user = await prisma.user.findUnique({
               where: { id: userId, role: Role.UNIVERSITY_USER },
               select: {
                    id: true,
                    fullName: true,
                    managedMajors: {
                         select: { id: true, name: true, language: true }
                    },
                    managedCompanies: {
                         select: { id: true, name: true, website: true }
                    }
               }
          });

          if (!user) {
               throw new NotFoundError('Egyetemi referens');
          }

          return user;
     }

     async assignMajors(userId: string, majorIds: string[]) {
          const user = await prisma.user.findUnique({
               where: { id: userId, role: Role.UNIVERSITY_USER }
          });

          if (!user) {
               throw new NotFoundError('Egyetemi referens');
          }

          return await prisma.user.update({
               where: { id: userId },
               data: {
                    managedMajors: {
                         set: majorIds.map(id => ({ id }))
                    }
               },
               include: {
                    managedMajors: true
               }
          });
     }

     async assignCompanies(userId: string, companyIds: string[]) {
          const user = await prisma.user.findUnique({
               where: { id: userId, role: Role.UNIVERSITY_USER }
          });

          if (!user) {
               throw new NotFoundError('Egyetemi referens');
          }

          return await prisma.user.update({
               where: { id: userId },
               data: {
                    managedCompanies: {
                         set: companyIds.map(id => ({ id }))
                    }
               },
               include: {
                    managedCompanies: true
               }
          });
     }

     async getAllReferents() {
          return await prisma.user.findMany({
               where: { role: Role.UNIVERSITY_USER, isActive: true },
               select: {
                    id: true,
                    fullName: true,
                    email: true,
                    managedMajors: { select: { name: true } },
                    managedCompanies: { select: { name: true } }
               }
          });
     }

     async findReferentForPartnership(studentId: string, positionId: string) {
          // 1. Get student's major and position's company
          const student = await prisma.studentProfile.findUnique({
               where: { id: studentId },
               select: { majorId: true }
          });

          const position = await prisma.position.findUnique({
               where: { id: positionId },
               select: { companyId: true }
          });

          if (!student?.majorId || !position?.companyId) return null;

          // 2. Find referent linked to BOTH
          const referent = await prisma.user.findFirst({
               where: {
                    role: Role.UNIVERSITY_USER,
                    isActive: true,
                    managedMajors: {
                         some: { id: student.majorId }
                    },
                    managedCompanies: {
                         some: { id: position.companyId }
                    }
               },
               select: { id: true }
          });

          return referent?.id || null;
     }
}

export const universityUserService = new UniversityUserService();
