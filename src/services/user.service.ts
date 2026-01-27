import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { Role } from '@prisma/client';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination';

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

     async getAllByRole(role: Role | Role[], companyId?: string, params?: Required<PaginationParams>) {
          const where = {
               role: Array.isArray(role) ? { in: role } : role,
               deletedAt: null,
               ...(companyId && {
                    companyEmployee: { companyId }
               })
          };

          const select = {
               ...this.userSelect,
               companyEmployee: { select: { company: { select: { id: true, name: true } } } }
          };

          const orderBy = { fullName: "asc" as const };

          if (params) {
               const { skip, take } = getPrismaSkipTake(params);
               return await paginate(
                    params,
                    prisma.user.findMany({ where, select, orderBy, skip, take }),
                    prisma.user.count({ where })
               );
          }

          return await prisma.user.findMany({ where, select, orderBy });
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

     async getInactive(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               isActive: false,
               deletedAt: null
          };

          return await paginate(
               params,
               prisma.user.findMany({
                    where,
                    select: this.userSelect,
                    orderBy: { fullName: "asc" as const },
                    skip,
                    take
               }),
               prisma.user.count({ where })
          );
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
