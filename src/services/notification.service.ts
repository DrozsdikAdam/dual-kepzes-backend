import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';

export class NotificationService {
     private notificationSelect = {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          isArchived: true,
          sentAt: true,
     };

     async getByUser(userId: string, isArchived: boolean = false) {
          return await prisma.notification.findMany({
               where: { userId, isArchived },
               orderBy: { createdAt: "desc" },
               select: this.notificationSelect
          });
     }

     async getById(id: string, userId: string) {
          const notification = await prisma.notification.findFirst({
               where: { id, userId },
               select: this.notificationSelect
          });

          if (!notification) {
               throw new NotFoundError('Értesítés');
          }

          return notification;
     }

     async markAsRead(id: string, userId: string) {
          return await prisma.notification.update({
               where: { id, userId },
               data: { isRead: true },
               select: this.notificationSelect
          });
     }

     async markAllAsRead(userId: string) {
          return await prisma.notification.updateMany({
               where: { userId },
               data: { isRead: true },
          });
     }

     async delete(id: string, userId: string) {
          return await prisma.notification.update({
               where: { id, userId },
               data: { isArchived: true, deletedAt: new Date() },
               select: this.notificationSelect
          });
     }

     async setArchiveStatus(id: string, userId: string, isArchived: boolean) {
          return await prisma.notification.update({
               where: { id, userId },
               data: { isArchived },
               select: this.notificationSelect
          });
     }

     async create(data: {
          userId: string;
          title: string;
          message: string;
          type: string;
     }) {
          return await prisma.notification.create({
               data,
               select: this.notificationSelect
          });
     }

     async getUnreadCount(userId: string) {
          return await prisma.notification.count({
               where: { userId, isRead: false, isArchived: false }
          });
     }
}

export const notificationService = new NotificationService();
