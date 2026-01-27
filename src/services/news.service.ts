import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination';

export class NewsService {
     private newsSelect = {
          id: true,
          title: true,
          content: true,
          isImportant: true,
          targetGroup: true,
          tags: true,
          createdAt: true,
          isArchived: true
     };

     async create(data: {
          title: string;
          content: string;
          isImportant?: boolean;
          targetGroup?: string;
          tags?: string[];
     }) {
          return await prisma.news.create({
               data,
               select: this.newsSelect
          });
     }

     async getAll(params: Required<PaginationParams>, role?: string, isArchived: boolean = false) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = { isArchived, deletedAt: null };

          const dataPromise = prisma.news.findMany({
               where,
               orderBy: { createdAt: 'desc' as const },
               select: this.newsSelect,
               skip,
               take
          });

          const paginated = await paginate(
               params,
               dataPromise,
               prisma.news.count({ where })
          );

          if (role === 'SYSTEM_ADMIN') {
               return paginated;
          }

          paginated.data = paginated.data.filter((item) => {
               if (item.targetGroup === 'ALL' || item.targetGroup === 'All') return true;
               if (item.targetGroup === 'STUDENT' && role === 'STUDENT') return true;
               return false;
          });

          return paginated;
     }

     async getById(id: string, isArchived?: boolean) {
          const news = await prisma.news.findFirst({
               where: {
                    id,
                    ...(isArchived !== undefined && { isArchived })
               },
               select: this.newsSelect
          });

          if (!news) {
               throw new NotFoundError('Hír');
          }

          return news;
     }

     async update(id: string, data: any) {
          return await prisma.news.update({
               where: { id },
               data,
               select: this.newsSelect
          });
     }

     async setArchiveStatus(id: string, isArchived: boolean) {
          return await prisma.news.update({
               where: { id },
               data: { isArchived },
               select: this.newsSelect
          });
     }

     async delete(id: string) {
          return await prisma.news.update({
               where: { id },
               data: { deletedAt: new Date() }
          });
     }
}

export const newsService = new NewsService();
