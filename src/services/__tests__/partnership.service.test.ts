import { partnershipService } from '../partnership.service';
import { NotFoundError } from '../../errors/AppError';
import prisma from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          dualPartnership: {
               findFirst: jest.fn(),
               findUnique: jest.fn(),
               update: jest.fn(),
          },
          studentProfile: {
               findUnique: jest.fn(),
          },
          companyEmployee: {
               findUnique: jest.fn(),
          },
     },
}));

describe('PartnershipService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('getById', () => {
          it('should throw NotFoundError when partnership does not exist', async () => {
               (prisma.dualPartnership.findFirst as jest.Mock).mockResolvedValue(null);
               (prisma.studentProfile.findUnique as jest.Mock).mockResolvedValue(null);

               await expect(
                    partnershipService.getById('non-existent-id', 'user-id')
               ).rejects.toThrow('Partnerség nem található.');
          });

          it('should return partnership if found for student', async () => {
               const mockPartnership = { id: 'p1', studentId: 's1' };
               (prisma.dualPartnership.findFirst as jest.Mock)
                    .mockResolvedValueOnce(null) // Not found as company/mentor
                    .mockResolvedValueOnce(mockPartnership); // Found as student

               (prisma.studentProfile.findUnique as jest.Mock).mockResolvedValue({ id: 's1' });

               const result = await partnershipService.getById('p1', 'user-id');
               expect(result).toEqual(mockPartnership);
          });
     });

     describe('terminate', () => {
          it('should update status to TERMINATED', async () => {
               const mockPartnership = { id: 'p1' };
               (prisma.dualPartnership.findUnique as jest.Mock).mockResolvedValue(mockPartnership);
               (prisma.dualPartnership.update as jest.Mock).mockResolvedValue({ ...mockPartnership, status: 'TERMINATED' });

               const result = await partnershipService.terminate('p1', 'u1');
               expect(result.status).toBe('TERMINATED');
               expect(prisma.dualPartnership.update).toHaveBeenCalledWith(expect.objectContaining({
                    where: { id: 'p1' },
                    data: { status: 'TERMINATED' }
               }));
          });
     });
});
