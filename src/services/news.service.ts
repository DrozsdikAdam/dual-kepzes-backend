import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';

import { Role } from '@prisma/client';
import { notificationService } from './notification.service';
import { NOTIFICATION_TYPES } from '../utils/constants';

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
          const news = await prisma.news.create({
               data,
               select: this.newsSelect
          });

          // Background notification
          this.notifyTargetUsers(news).catch(err =>
               console.error('[NewsService.create] Notification error:', err)
          );

          return news;
     }

     private async notifyTargetUsers(news: any) {
          const targetGroup = news.targetGroup?.toUpperCase();
          let targetUsers: { id: string }[] = [];

          if (targetGroup === "ALL") {
               targetUsers = await prisma.user.findMany({
                    where: { isActive: true, deletedAt: null },
                    select: { id: true }
               });
          } else if (Object.values(Role).includes(targetGroup as Role)) {
               targetUsers = await prisma.user.findMany({
                    where: { role: targetGroup as Role, isActive: true, deletedAt: null },
                    select: { id: true }
               });
          }

          const notifications = targetUsers.map(user =>
               notificationService.create({
                    userId: user.id,
                    title: news.isImportant ? "🔔 Fontos hír!" : "Új hír érkezett",
                    message: news.title,
                    type: NOTIFICATION_TYPES.NEW_NEWS
               })
          );

          await Promise.all(notifications);
     }

     async getAll(params: Required<PaginationParams>, role?: Role, isArchived: boolean = false) {
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

          if (role === Role.SYSTEM_ADMIN) {
               return paginated;
          }

          paginated.data = paginated.data.filter((item) => {
               const target = item.targetGroup?.toUpperCase();
               if (target === 'ALL') return true;
               if (target === role) return true;
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
          const { id: _, ...updateData } = data;
          return await prisma.news.update({
               where: { id },
               data: updateData,
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
