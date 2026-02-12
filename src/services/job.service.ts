import prisma from '../config/prisma';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { PositionInput } from '../schemas/job.schema';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';

export class JobService {
     private positionSelect = {
          id: true,
          title: true,
          description: true,
          majorId: true,
          major: {
               select: {
                    id: true,
                    name: true,
                    language: true
               }
          },
          location: {
               select: {
                    zipCode: true,
                    city: true,
                    address: true
               }
          },
          deadline: true,
          companyId: true,
          locationId: true,
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

     async getAll(params: Required<PaginationParams>, isDual?: boolean) {
          const { skip, take } = getPrismaSkipTake(params);

          const query = {
               where: {
                    isActive: true,
                    ...(isDual !== undefined ? { isDual } : {})
               },
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
               orderBy: { deadline: "asc" as const }
          };

          return await paginate(
               params,
               prisma.position.findMany({ ...query, skip, take }),
               prisma.position.count({ where: query.where })
          );
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
          // Ellenőrizzük, hogy a helyszín a céghez tartozik-e
          const location = await prisma.location.findFirst({
               where: {
                    id: data.locationId,
                    companyId: data.companyId
               }
          });

          if (!location) {
               throw new BadRequestError("A megadott helyszín nem tartozik ehhez a céghez.");
          }

          return await prisma.position.create({
               data: {
                    title: data.title,
                    description: data.description,
                    deadline: data.deadline,
                    isDual: data.isDual,
                    company: { connect: { id: data.companyId } },
                    location: { connect: { id: data.locationId } },
                    major: data.majorId ? { connect: { id: data.majorId } } : undefined,
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
          const { tagNames, locationId, majorId, ...rest } = data;

          if (locationId) {
               const position = await prisma.position.findUnique({
                    where: { id },
                    select: { companyId: true }
               });

               if (!position) throw new NotFoundError('Pozíció');

               const location = await prisma.location.findFirst({
                    where: {
                         id: locationId,
                         companyId: position.companyId
                    }
               });

               if (!location) {
                    throw new BadRequestError("A megadott helyszín nem tartozik ehhez a céghez.");
               }
          }

          return await prisma.position.update({
               where: { id },
               data: {
                    ...rest,
                    location: locationId ? {
                         connect: { id: locationId }
                    } : undefined,
                    major: majorId !== undefined
                         ? (majorId ? { connect: { id: majorId } } : { disconnect: true })
                         : undefined,
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
