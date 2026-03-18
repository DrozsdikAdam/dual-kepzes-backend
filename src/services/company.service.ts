import prisma from '../config/prisma';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { CompanyInput, CompanyUpdateInput } from '../schemas/job.schema';
import { CompanyWithAdminInput } from '../schemas/company.schema';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';
import { hashPassword } from '../utils/auth.util';
import { Role, Prisma } from '@prisma/client';
import { prepareLocationData } from '../utils/location.util';
import { notificationService } from './notification.service';
import { notifySystemAdmins } from '../utils/notification.util';
import { NOTIFICATION_TYPES } from '../utils/constants';

export class CompanyService {
     private companySelect = {
          id: true,
          name: true,
          taxId: true,
          description: true,
          location: {
               select: {
                    id: true,
                    country: true,
                    zipCode: true,
                    city: true,
                    address: true
               }
          },
          contactName: true,
          contactEmail: true,
          website: true,
          logoUrl: true,
          hasOwnApplication: true,
          isActive: true,
          createdAt: true,
          deletedAt: true
     };

     async getAll(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               isActive: true,
               status: 'APPROVED' as const,
               deletedAt: null
          };

          return await paginate(
               params,
               prisma.company.findMany({
                    where,
                    select: {
                         ...this.companySelect,
                         _count: {
                              select: {
                                   positions: {
                                        where: { deletedAt: null }
                                   }
                              }
                         }
                    },
                    skip,
                    take,
                    orderBy: { name: 'asc' as const }
               }),
               prisma.company.count({ where })
          );
     }

     async getById(id: string) {
          const company = await prisma.company.findUnique({
               where: { id },
               select: {
                    ...this.companySelect,
                    positions: {
                         where: {
                              isActive: true,
                              deletedAt: null
                         },
                         select: {
                              id: true,
                              title: true,
                              description: true,
                              location: {
                                   select: {
                                        zipCode: true,
                                        city: true,
                                        address: true
                                   }
                              },
                              deadline: true,
                              isActive: true,
                              isDual: true,
                              createdAt: true,
                              updatedAt: true,
                              tags: {
                                   select: {
                                        name: true,
                                        category: true
                                   }
                              }
                         }
                    },
                    employees: {
                         where: {
                              deletedAt: null
                         },
                         select: {
                              id: true,
                              jobTitle: true,
                              user: {
                                   select: {
                                        fullName: true,
                                        email: true
                                   }
                              }
                         }
                    }
               }
          });

          if (!company) {
               throw new NotFoundError('Cég');
          }

          return company;
     }

     async create(data: CompanyInput) {
          const existingCompany = await prisma.company.findUnique({
               where: { taxId: data.taxId },
          });

          if (existingCompany) {
               throw new BadRequestError('Már létezik cég a megadott adószámmal.');
          }

          const { locations, ...companyData } = data;

          return await prisma.company.create({
               data: {
                    ...companyData,
                    location: {
                         create: locations ? locations.map(prepareLocationData) : []
                    },
                    status: 'APPROVED',
                    isActive: true
               },
               select: this.companySelect
          });
     }

     async createWithAdmin(data: CompanyWithAdminInput) {
          const { company: companyInput, admin: adminInput } = data;

          // Ellenőrzések tranzakción kívül az adatok érvényességéhez
          const existingCompany = await prisma.company.findUnique({
               where: { taxId: companyInput.taxId },
          });

          if (existingCompany) {
               throw new BadRequestError('Már létezik cég a megadott adószámmal.');
          }

          const existingUser = await prisma.user.findUnique({
               where: { email: adminInput.email }
          });

          if (existingUser) {
               throw new BadRequestError('A megadott email címmel már létezik felhasználó.');
          }

          const { locations, ...companyData } = companyInput;
          const hashedPassword = await hashPassword(adminInput.password);

          const company = await prisma.$transaction(async (tx) => {
               const company = await tx.company.create({
                    data: {
                         ...companyData,
                         location: {
                              create: locations ? locations.map(prepareLocationData) : []
                         },
                         status: 'PENDING',
                         isActive: false
                    },
                    select: this.companySelect
               });

               const user = await tx.user.create({
                    data: {
                         email: adminInput.email,
                         password: hashedPassword,
                         fullName: adminInput.fullName,
                         phoneNumber: adminInput.phoneNumber,
                         role: Role.COMPANY_ADMIN,
                         isEmailVerified: true,
                         isActive: false
                    }
               });

               await tx.companyEmployee.create({
                    data: {
                         userId: user.id,
                         companyId: company.id,
                         jobTitle: adminInput.jobTitle
                    }
               });

               return company;
          });

          // Background notification
          notifySystemAdmins({
               title: "Új cég regisztráció",
               message: `Új cég regisztrált a rendszerbe: ${company.name}`,
               type: NOTIFICATION_TYPES.COMPANY_CREATE
          }).catch(err => console.error('[CompanyService.createWithAdmin] Notification error:', err));

          return company;
     }

     async update(id: string, data: CompanyUpdateInput) {
          // Restricted field protection
          const { locations, ...companyRest } = data;
          const locationOperations: Prisma.LocationUpdateManyWithoutCompanyNestedInput = {};

          if (locations && locations.length > 0) {
               const startNew = locations.filter((l) => !l.id);
               const toUpdate = locations.filter((l) => l.id);

               if (startNew.length > 0) {
                    locationOperations.create = startNew.map((l) => prepareLocationData(l));
               }

               if (toUpdate.length > 0) {
                    locationOperations.update = toUpdate.map((loc) => ({
                         where: { id: loc.id },
                         data: {
                              country: loc.country,
                              zipCode: loc.zipCode ? String(loc.zipCode) : undefined,
                              city: loc.city,
                              address: loc.address
                         }
                    }));
               }
          }

          try {
               return await prisma.company.update({
                    where: { id },
                    data: {
                         ...companyRest,
                         location: locationOperations
                    },
                    select: this.companySelect
               });
          } catch (error) {
               throw new BadRequestError('Hiba a cég frissítésekor. Ellenőrizd az adatokat!');
          }
     }

     async delete(id: string) {
          return await prisma.$transaction([
               prisma.company.update({
                    where: { id },
                    data: { isActive: false, deletedAt: new Date() }
               }),
               prisma.position.updateMany({
                    where: { companyId: id },
                    data: { isActive: false, deletedAt: new Date() }
               }),
               prisma.companyEmployee.updateMany({
                    where: { companyId: id },
                    data: { deletedAt: new Date() }
               })
          ]);
     }

     async getInactive(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               isActive: false,
               status: 'APPROVED' as const,
               deletedAt: null
          };

          return await paginate(
               params,
               prisma.company.findMany({
                    where,
                    select: this.companySelect,
                    orderBy: { name: "asc" as const },
                    skip,
                    take
               }),
               prisma.company.count({ where })
          );
     }

     async getPending(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               status: 'PENDING' as const,
               deletedAt: null
          };

          return await paginate(
               params,
               prisma.company.findMany({
                    where,
                    select: this.companySelect,
                    orderBy: { createdAt: "desc" as const },
                    skip,
                    take
               }),
               prisma.company.count({ where })
          );
     }

     async approve(id: string) {
          const company = await prisma.company.findUnique({
               where: { id },
               include: { employees: true }
          });

          if (!company) throw new NotFoundError('Cég');

          return await prisma.$transaction(async (tx) => {
               // Activate company
               const updatedCompany = await tx.company.update({
                    where: { id },
                    data: {
                         status: 'APPROVED',
                         isActive: true
                    },
                    select: this.companySelect
               });

               // Activate company employees (admins/mentors)
               await tx.user.updateMany({
                    where: {
                         companyEmployee: {
                              companyId: id
                         }
                    },
                    data: { isActive: true }
               });

               // Notifications
               notifySystemAdmins({
                    title: "Cég jóváhagyva",
                    message: `A(z) ${updatedCompany.name} cég regisztrációja jóváhagyásra került.`,
                    type: NOTIFICATION_TYPES.COMPANY_STATUS
               }).catch(err => console.error('[CompanyService.approve] Admin notification error:', err));

               return updatedCompany;
          });
     }

     async reject(id: string) {
          const company = await prisma.company.findUnique({
               where: { id }
          });

          if (!company) throw new NotFoundError('Cég');

          const updated = await prisma.company.update({
               where: { id },
               data: {
                    status: 'REJECTED',
                    isActive: false
               },
               select: this.companySelect
          });

          notifySystemAdmins({
               title: "Cég elutasítva",
               message: `A(z) ${updated.name} cég regisztrációja elutasításra került.`,
               type: NOTIFICATION_TYPES.COMPANY_STATUS
          }).catch(err => console.error('[CompanyService.reject] Admin notification error:', err));

          return updated;
     }

     async setStatus(id: string, isActive: boolean) {
          const company = await prisma.company.findFirst({
               where: { id, deletedAt: null }
          });

          if (!company) {
               throw new NotFoundError('Cég');
          }

          const updated = await prisma.company.update({
               where: { id },
               data: { isActive },
               select: this.companySelect
          });

          // Notifications
          notifySystemAdmins({
               title: "Cég státusz változás",
               message: `A(z) ${updated.name} cég státusza megváltozott: ${isActive ? "Aktív" : "Inaktív"}`,
               type: NOTIFICATION_TYPES.COMPANY_STATUS
          }).catch(err => console.error('[CompanyService.setStatus] Admin notification error:', err));

          // Notify company admins
          this.notifyCompanyAdminsOfStatusChange(id, updated.name, isActive).catch(err =>
               console.error('[CompanyService.setStatus] Company admin notification error:', err)
          );

          return updated;
     }

     private async notifyCompanyAdminsOfStatusChange(companyId: string, companyName: string, isActive: boolean) {
          const companyAdmins = await prisma.user.findMany({
               where: {
                    role: Role.COMPANY_ADMIN,
                    companyEmployee: {
                         companyId: companyId
                    }
               },
               select: { id: true }
          });

          const notifications = companyAdmins.map(admin =>
               notificationService.create({
                    userId: admin.id,
                    title: "Cégstátusz váltás",
                    message: `A cégetek (${companyName}) státusza megváltozott: ${isActive ? 'Aktív' : 'Inaktív'}`,
                    type: NOTIFICATION_TYPES.COMPANY_STATUS
               })
          );

          await Promise.all(notifications);
     }

     async getOwnApplicationCompanies(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               isActive: true,
               status: 'APPROVED' as const,
               hasOwnApplication: true,
               deletedAt: null
          };

          return await paginate(
               params,
               prisma.company.findMany({
                    where,
                    select: this.companySelect,
                    skip,
                    take,
                    orderBy: { name: 'asc' as const }
               }),
               prisma.company.count({ where })
          );
     }
}

export const companyService = new CompanyService();
