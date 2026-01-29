import prisma from '../config/prisma';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { CompanyInput } from '../schemas/jobSchema';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination';

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
          isActive: true,
          createdAt: true,
          deletedAt: true
     };

     async getAll(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = { deletedAt: null };

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
                         create: locations ? locations.map(loc => ({
                              country: loc.country || "Magyarország",
                              zipCode: loc.zipCode ? String(loc.zipCode) : "",
                              city: loc.city || "",
                              address: loc.address || ""
                         })) : []
                    },
               },
               select: this.companySelect
          });
     }

     async update(id: string, data: any) {
          const { locations, ...companyRest } = data;
          const locationOperations: any = {};

          if (locations && locations.length > 0) {
               const startNew = locations.filter((l: any) => !l.id);
               const toUpdate = locations.filter((l: any) => l.id);

               if (startNew.length > 0) {
                    locationOperations.create = startNew.map((loc: any) => ({
                         country: loc.country || "Magyarország",
                         zipCode: loc.zipCode ? String(loc.zipCode) : "",
                         city: loc.city || "",
                         address: loc.address || ""
                    }));
               }

               if (toUpdate.length > 0) {
                    locationOperations.update = toUpdate.map((loc: any) => ({
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

     async setStatus(id: string, isActive: boolean) {
          const company = await prisma.company.findFirst({
               where: { id, deletedAt: null }
          });

          if (!company) {
               throw new NotFoundError('Cég');
          }

          return await prisma.company.update({
               where: { id },
               data: { isActive },
               select: this.companySelect
          });
     }
}

export const companyService = new CompanyService();
