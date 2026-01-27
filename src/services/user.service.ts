import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { Role } from '@prisma/client';

export class UserService {
     private userSelect = {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          deletedAt: true
     };

     async getById(id: string, role?: Role) {
          const user = await prisma.user.findFirst({
               where: {
                    id,
                    ...(role && { role }),
                    deletedAt: null
               },
               select: {
                    ...this.userSelect,
                    companyEmployee: {
                         select: {
                              id: true,
                              jobTitle: true,
                              company: {
                                   select: {
                                        id: true,
                                        name: true
                                   }
                              }
                         }
                    }
               }
          });

          if (!user) {
               throw new NotFoundError('Felhasználó');
          }

          return user;
     }

     async getAllByRole(role: Role | Role[], companyId?: string) {
          return await prisma.user.findMany({
               where: {
                    role: Array.isArray(role) ? { in: role } : role,
                    deletedAt: null,
                    ...(companyId && {
                         companyEmployee: { companyId }
                    })
               },
               select: {
                    ...this.userSelect,
                    companyEmployee: { select: { company: { select: { id: true, name: true } } } }
               },
               orderBy: { fullName: "asc" }
          });
     }

     async update(id: string, data: any, updaterRole: Role) {
          const { fullName, phoneNumber, isActive, jobTitle } = data;

          const user = await prisma.user.findUnique({
               where: { id },
               include: { companyEmployee: true }
          });

          if (!user) {
               throw new NotFoundError('Felhasználó');
          }

          return await prisma.$transaction(async (tx) => {
               const updatedUser = await tx.user.update({
                    where: { id },
                    data: {
                         fullName,
                         phoneNumber,
                         isActive: updaterRole === Role.SYSTEM_ADMIN ? isActive : undefined
                    },
                    select: this.userSelect
               });

               if (jobTitle !== undefined && user.companyEmployee) {
                    await tx.companyEmployee.update({
                         where: { userId: id },
                         data: { jobTitle }
                    });
               }

               return updatedUser;
          });
     }

     async delete(id: string) {
          return await prisma.$transaction([
               prisma.user.update({
                    where: { id },
                    data: { isActive: false, deletedAt: new Date() }
               }),
               prisma.companyEmployee.updateMany({
                    where: { userId: id },
                    data: { deletedAt: new Date() }
               })
          ]);
     }

     async getInactive() {
          return await prisma.user.findMany({
               where: {
                    isActive: false,
                    deletedAt: null
               },
               select: this.userSelect,
               orderBy: { fullName: "asc" }
          });
     }

     async setStatus(id: string, isActive: boolean) {
          const user = await prisma.user.findFirst({
               where: { id, deletedAt: null }
          });

          if (!user) {
               throw new NotFoundError('Felhasználó');
          }

          return await prisma.user.update({
               where: { id },
               data: { isActive },
               select: this.userSelect
          });
     }

     async restore(id: string) {
          return await prisma.$transaction(async (tx) => {
               const user = await tx.user.update({
                    where: { id },
                    data: { isActive: true, deletedAt: null },
                    select: this.userSelect
               });

               await tx.companyEmployee.updateMany({
                    where: { userId: id },
                    data: { deletedAt: null }
               });

               return user;
          });
     }
}

export const userService = new UserService();
