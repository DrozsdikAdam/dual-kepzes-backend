import { studentService } from '../student.service';
import prisma from '../../config/prisma';
import { Role } from '@prisma/client';
import { NotFoundError } from '../../errors/AppError';
import { notificationService } from '../notification.service';
import { addEmailToQueue } from '../email.queue';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          user: {
               findUnique: jest.fn(),
               update: jest.fn(),
          },
          notification: {
               create: jest.fn(),
          },
     },
}));

jest.mock('../notification.service', () => ({
     notificationService: {
          create: jest.fn(),
          shouldSendEmail: jest.fn().mockReturnValue(true),
     },
}));

jest.mock('../email.queue', () => ({
     addEmailToQueue: jest.fn(),
}));

describe('StudentService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('getProfile', () => {
          it('should return student profile if found', async () => {
               const mockStudent = { id: 's1', role: Role.STUDENT, studentProfile: { id: 'sp1' } };
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

               const result = await studentService.getProfile('s1');
               expect(result).toEqual(mockStudent);
          });

          it('should throw NotFoundError if student not found', async () => {
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

               await expect(studentService.getProfile('s1')).rejects.toThrow('Hallgatói profil nem található.');
          });
     });

     describe('toggleAvailableForWork', () => {
          it('should toggle availability', async () => {
               const mockUser = { id: 's1', studentProfile: { isAvailableForWork: false, motivationLetter: 'Existing letter' } };
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
               (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, studentProfile: { isAvailableForWork: true } });

               const result = await studentService.toggleAvailableForWork('s1');
               expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                         studentProfile: expect.objectContaining({
                              update: expect.objectContaining({
                                   isAvailableForWork: true,
                                   motivationLetter: 'Existing letter'
                              })
                         })
                    })
               }));
          });
     });

     describe('expressInterest', () => {
          it('should express interest and queue email', async () => {
               const mockStudent = { id: 's1', email: 's@test.com', role: Role.STUDENT, isEmailEnabled: true };
               const mockInterested = { fullName: 'Interested User', email: 'i@test.com' };

               (prisma.user.findUnique as jest.Mock)
                    .mockResolvedValueOnce(mockStudent)
                    .mockResolvedValueOnce(mockInterested);

               (notificationService.create as jest.Mock).mockResolvedValue({ id: 'n1' });

               const result = await studentService.expressInterest('s1', 'i1', 'Hello');

               expect(result.success).toBe(true);
               expect(notificationService.create).toHaveBeenCalled();
               expect(addEmailToQueue).toHaveBeenCalled();
          });

          it('should throw NotFoundError if student not found', async () => {
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

               await expect(studentService.expressInterest('s1', 'i1')).rejects.toThrow('Hallgatói profil nem található.');
          });
     });
});
