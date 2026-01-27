import { userService } from '../user.service';
import { Role } from '@prisma/client';
import prisma from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          user: {
               findFirst: jest.fn(),
               findMany: jest.fn(),
               count: jest.fn(),
               update: jest.fn(),
          },
     },
}));

describe('UserService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('getById', () => {
          it('should throw NotFoundError if user not found', async () => {
               (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

               await expect(
                    userService.getById('u1')
               ).rejects.toThrow('Felhasználó nem található.');
          });

          it('should return user if found', async () => {
               const mockUser = { id: 'u1', email: 'test@example.com' };
               (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

               const result = await userService.getById('u1');
               expect(result).toEqual(mockUser);
          });
     });

     describe('getAllByRole', () => {
          it('should return paginated results when params provided', async () => {
               const mockUsers = [{ id: 'u1' }];
               (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
               (prisma.user.count as jest.Mock).mockResolvedValue(1);

               const result = await userService.getAllByRole(Role.STUDENT, undefined, { page: 1, limit: 10 });
               expect((result as any).data).toHaveLength(1);
               expect((result as any).pagination.total).toBe(1);
          });
     });
});
