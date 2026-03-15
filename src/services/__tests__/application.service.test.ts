import { applicationService } from '../application.service';
import { NotFoundError, ForbiddenError, AppError } from '../../errors/AppError';
import prisma from '../../config/prisma';

jest.mock('../../config/prisma', () => {
     const mockPrisma: any = {
          application: {
               findUnique: jest.fn(),
               findFirst: jest.fn(),
               findMany: jest.fn(),
               count: jest.fn(),
               create: jest.fn(),
               update: jest.fn(),
          },
          position: {
               findUnique: jest.fn(),
          },
          studentProfile: {
               findUnique: jest.fn(),
          },
          user: {
               findMany: jest.fn(),
          },
          dualPartnership: {
               findFirst: jest.fn(),
               create: jest.fn(),
          },
     };
     mockPrisma.$transaction = jest.fn(async (cb) => cb(mockPrisma));
     
     return {
          __esModule: true,
          default: mockPrisma
     };
});

jest.mock('../../utils/company.util', () => ({
     getCompanyIdForUser: jest.fn(),
}));

describe('ApplicationService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('apply', () => {
          it('should throw NotFoundError if position not found', async () => {
               (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

               await expect(
                    applicationService.apply('s1', 'non-existent-p1')
               ).rejects.toThrow('Pozíció nem található.');
          });

          it('should create application successfully', async () => {
               (prisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', isActive: true });
               (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);
               (prisma.application.create as jest.Mock).mockResolvedValue({ id: 'a1', status: 'SUBMITTED' });

               const result = await applicationService.apply('s1', 'p1');
               expect(result.id).toBe('a1');
               expect(prisma.application.create).toHaveBeenCalled();
          });
     });

     describe('getCompanyApplications', () => {
          it('should throw ForbiddenError if user has no companyId', async () => {
               const { getCompanyIdForUser } = require('../../utils/company.util');
               getCompanyIdForUser.mockResolvedValue(null);

               await expect(
                    applicationService.getCompanyApplications('u1', { page: 1, limit: 10 })
               ).rejects.toThrow('Nincs jogosultsága a művelethez.');
          });
     });

     describe('evaluate', () => {
          const { getCompanyIdForUser } = require('../../utils/company.util');
          
          beforeEach(() => {
               getCompanyIdForUser.mockResolvedValue('company-id-1');
          });

          it('should create dual partnership if accepted and no active partnership exists', async () => {
               (prisma.application.findFirst as jest.Mock).mockResolvedValue({
                    id: 'app1',
                    studentId: 'stud1',
                    positionId: 'pos1',
                    status: 'SUBMITTED',
                    position: { companyId: 'company-id-1' }
               });
               (prisma.dualPartnership.findFirst as jest.Mock).mockResolvedValue(null);
               (prisma.application.update as jest.Mock).mockResolvedValue({ id: 'app1', status: 'ACCEPTED' });

               const { ApplicationStatus } = require('@prisma/client');
               
               await applicationService.evaluate('app1', 'user1', 'ACCEPTED' as any);
               
               expect(prisma.dualPartnership.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                    where: expect.objectContaining({ studentId: 'stud1' })
               }));
               expect(prisma.dualPartnership.create).toHaveBeenCalled();
          });

          it('should throw BadRequestError if accepted and student already has active partnership', async () => {
               (prisma.application.findFirst as jest.Mock).mockResolvedValue({
                    id: 'app2',
                    studentId: 'stud2',
                    status: 'SUBMITTED',
                    position: { companyId: 'company-id-1' }
               });
               (prisma.dualPartnership.findFirst as jest.Mock).mockResolvedValue({
                    id: 'existing-dp'
               });

               const { ApplicationStatus } = require('@prisma/client');
               
               await expect(
                    applicationService.evaluate('app2', 'user1', 'ACCEPTED' as any)
               ).rejects.toThrow('A hallgatónak már van aktív vagy folyamatban lévő duális kapcsolata.');
          });
     });
});
