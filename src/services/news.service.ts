import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';

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

     async getAll(role?: string, isArchived: boolean = false) {
          const news = await prisma.news.findMany({
               where: { isArchived },
               orderBy: { createdAt: 'desc' },
               select: this.newsSelect
          });

          if (role === 'SYSTEM_ADMIN') {
               return news;
          }

          // Filter for non-admin users
          return news.filter((item) => {
               if (item.targetGroup === 'ALL' || item.targetGroup === 'All') return true;
               if (item.targetGroup === 'STUDENT' && role === 'STUDENT') return true;
               return false;
          });
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
