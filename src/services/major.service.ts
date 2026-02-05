import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';

export class MajorService {
     private majorSelect = {
          id: true,
          name: true,
          language: true
     };

     async create(data: { name: string; language: string }) {
          return await prisma.major.create({
               data,
               select: this.majorSelect
          });
     }

     async getAll(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);

          return await paginate(
               params,
               prisma.major.findMany({
                    orderBy: { name: 'asc' as const },
                    select: this.majorSelect,
                    skip,
                    take
               }),
               prisma.major.count()
          );
     }

     async getById(id: string) {
          const major = await prisma.major.findUnique({
               where: { id },
               select: this.majorSelect
          });

          if (!major) {
               throw new NotFoundError('Szak');
          }

          return major;
     }

     async update(id: string, data: { name?: string; language?: string }) {
          const { id: _, ...updateData } = data as any;

          // Ellenőrizzük, hogy létezik-e
          await this.getById(id);

          return await prisma.major.update({
               where: { id },
               data: updateData,
               select: this.majorSelect
          });
     }

     async delete(id: string) {
          // Ellenőrizzük, hogy létezik-e
          await this.getById(id);

          return await prisma.major.delete({
               where: { id }
          });
     }
}

export const majorService = new MajorService();
