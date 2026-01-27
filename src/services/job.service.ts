import prisma from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { PositionInput } from '../schemas/jobSchema';

export class JobService {
     private positionSelect = {
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
     };

     async getAll() {
          return await prisma.position.findMany({
               where: { isActive: true },
               select: {
                    ...this.positionSelect,
                    company: {
                         select: {
                              name: true,
                              logoUrl: true,
                              location: {
                                   select: {
                                        city: true
                                   }
                              }
                         }
                    }
               },
               orderBy: { deadline: "asc" }
          });
     }

     async getById(id: string) {
          const position = await prisma.position.findUnique({
               where: { id },
               select: {
                    ...this.positionSelect,
                    company: {
                         select: {
                              id: true,
                              name: true,
                              taxId: true,
                              location: {
                                   select: {
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
                         }
                    }
               }
          });

          if (!position) {
               throw new NotFoundError('Pozíció');
          }

          return position;
     }

     async getByCompany(companyId: string) {
          return await prisma.position.findMany({
               where: { companyId, deletedAt: null },
               select: this.positionSelect,
               orderBy: { deadline: "asc" }
          });
     }

     async create(data: PositionInput) {
          return await prisma.position.create({
               data: {
                    title: data.title,
                    description: data.description,
                    deadline: data.deadline,
                    company: { connect: { id: data.companyId } },
                    location: {
                         create: {
                              country: data.location?.country || "Magyarország",
                              zipCode: data.location.zipCode,
                              city: data.location.city,
                              address: data.location.address
                         }
                    },
                    tags: data.tags && data.tags.length > 0 ? {
                         connectOrCreate: data.tags.map((tag) => ({
                              where: { name: tag.name },
                              create: { name: tag.name, category: tag.category },
                         })),
                    } : undefined,
               },
               select: this.positionSelect
          });
     }

     async update(id: string, data: any) {
          const { tagNames, location, ...rest } = data;

          return await prisma.position.update({
               where: { id },
               data: {
                    ...rest,
                    location: location ? {
                         update: {
                              country: location.country,
                              zipCode: location.zipCode,
                              city: location.city,
                              address: location.address
                         }
                    } : undefined,
                    tags: tagNames ? {
                         set: [],
                         connectOrCreate: tagNames.map((name: string) => ({
                              where: { name },
                              create: { name, category: "Technology" }
                         }))
                    } : undefined
               },
               select: this.positionSelect
          });
     }

     async delete(id: string) {
          return await prisma.position.update({
               where: { id },
               data: { isActive: false, deletedAt: new Date() }
          });
     }

     async setStatus(id: string, isActive: boolean) {
          const position = await prisma.position.findFirst({
               where: { id, deletedAt: null }
          });

          if (!position) {
               throw new NotFoundError('Pozíció');
          }

          return await prisma.position.update({
               where: { id },
               data: { isActive },
               select: this.positionSelect
          });
     }

     async getInactive() {
          return await prisma.position.findMany({
               where: { isActive: false, deletedAt: null },
               select: this.positionSelect
          });
     }

     async createTag(name: string) {
          return await prisma.tag.create({
               data: { name }
          });
     }
}

export const jobService = new JobService();
