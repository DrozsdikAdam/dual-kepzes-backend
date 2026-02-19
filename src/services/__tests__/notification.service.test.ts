import { notificationService } from '../notification.service';
import { Role } from '@prisma/client';
import prisma from '../../config/prisma';
import { NOTIFICATION_TYPES } from '../../utils/constants';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          notification: {
               findMany: jest.fn(),
               findFirst: jest.fn(),
               update: jest.fn(),
               updateMany: jest.fn(),
               create: jest.fn(),
               count: jest.fn(),
          },
     },
}));

describe('NotificationService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('shouldSendEmail', () => {
          it('should always return true for critical notification types', () => {
               expect(notificationService.shouldSendEmail(Role.STUDENT, NOTIFICATION_TYPES.EMAIL_VERIFICATION)).toBe(true);
               expect(notificationService.shouldSendEmail(Role.SYSTEM_ADMIN, NOTIFICATION_TYPES.PASSWORD_RESET)).toBe(true);
          });

          it('should return false if user email is disabled (non-critical types)', () => {
               expect(notificationService.shouldSendEmail(Role.STUDENT, 'OTHER_TYPE', false)).toBe(false);
          });

          it('should return false for SYSTEM_ADMIN on non-critical types even if email enabled', () => {
               expect(notificationService.shouldSendEmail(Role.SYSTEM_ADMIN, 'OTHER_TYPE', true)).toBe(false);
          });

          it('should return true for other roles for non-critical types if email enabled', () => {
               expect(notificationService.shouldSendEmail(Role.STUDENT, 'OTHER_TYPE', true)).toBe(true);
               expect(notificationService.shouldSendEmail(Role.COMPANY_ADMIN, 'OTHER_TYPE', true)).toBe(true);
          });
     });

     describe('getById', () => {
          it('should return notification if found', async () => {
               const mockNotif = { id: 'n1', userId: 'u1', title: 'Test' };
               (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotif);

               const result = await notificationService.getById('n1', 'u1');
               expect(result).toEqual(mockNotif);
          });

          it('should throw NotFoundError if notification not found or belongs to other user', async () => {
               (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

               await expect(notificationService.getById('n1', 'u1')).rejects.toThrow('Értesítés nem található.');
          });
     });

     describe('markAsRead', () => {
          it('should update and return notification', async () => {
               const mockNotif = { id: 'n1', isRead: true };
               (prisma.notification.update as jest.Mock).mockResolvedValue(mockNotif);

               const result = await notificationService.markAsRead('n1', 'u1');
               expect(result).toEqual(mockNotif);
               expect(prisma.notification.update).toHaveBeenCalledWith({
                    where: { id: 'n1', userId: 'u1' },
                    data: { isRead: true },
                    select: expect.any(Object)
               });
          });
     });
});
