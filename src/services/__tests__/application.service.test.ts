import { applicationService } from '../application.service';
import { NotFoundError, ForbiddenError, AppError } from '../../errors/AppError';
import prisma from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
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
     },
}));

jest.mock('../../utils/companyUtils', () => ({
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
               (prisma.application.create as jest.Mock).mockResolvedValue({ id: 'a1' });

               const result = await applicationService.apply('s1', 'p1');
               expect(result.id).toBe('a1');
               expect(prisma.application.create).toHaveBeenCalled();
          });
     });

     describe('getCompanyApplications', () => {
          it('should throw ForbiddenError if user has no companyId', async () => {
               const { getCompanyIdForUser } = require('../../utils/companyUtils');
               getCompanyIdForUser.mockResolvedValue(null);

               await expect(
                    applicationService.getCompanyApplications('u1', { page: 1, limit: 10 })
               ).rejects.toThrow('Nincs jogosultsága a művelethez.');
          });
     });
});
