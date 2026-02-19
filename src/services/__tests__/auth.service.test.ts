import { authService } from '../auth.service';
import prisma from '../../config/prisma';
import * as authUtils from '../../utils/auth.util';
import { Role } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from '../../errors/AppError';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          user: {
               findUnique: jest.fn(),
               findFirst: jest.fn(),
               update: jest.fn(),
               create: jest.fn(),
          },
          notification: {
               create: jest.fn(),
          },
          $transaction: jest.fn((cb) => cb(prisma)),
     },
}));

jest.mock('../../utils/auth.util', () => ({
     hashPassword: jest.fn(),
     comparePassword: jest.fn(),
     generateToken: jest.fn(),
     generateResetToken: jest.fn(),
     hashToken: jest.fn(),
}));

jest.mock('../notification.service', () => ({
     notificationService: {
          shouldSendEmail: jest.fn().mockReturnValue(true),
     },
}));

jest.mock('../email.queue', () => ({
     addEmailToQueue: jest.fn(),
}));

describe('AuthService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('login', () => {
          const loginData = { email: 'test@test.com', password: 'password123' };

          it('should login successfully and return a token', async () => {
               const mockUser = { id: 'u1', email: loginData.email, password: 'hashedPassword', role: Role.STUDENT, isActive: true };
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
               (authUtils.comparePassword as jest.Mock).mockResolvedValue(true);
               (authUtils.generateToken as jest.Mock).mockReturnValue('mockToken');

               const result = await authService.login(loginData);

               expect(result.token).toBe('mockToken');
               expect(result.user.id).toBe('u1');
          });

          it('should throw BadRequestError if user not found', async () => {
               (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

               await expect(authService.login(loginData)).rejects.toThrow('Hibás email vagy jelszó.');
          });

          it('should throw BadRequestError for invalid password', async () => {
               (prisma.user.findUnique as jest.Mock).mockResolvedValue({ password: 'hashed' });
               (authUtils.comparePassword as jest.Mock).mockResolvedValue(false);

               await expect(authService.login(loginData)).rejects.toThrow('Hibás email vagy jelszó.');
          });

          it('should throw UnauthorizedError if user is inactive', async () => {
               (prisma.user.findUnique as jest.Mock).mockResolvedValue({ password: 'hashed', isActive: false });
               (authUtils.comparePassword as jest.Mock).mockResolvedValue(true);

               await expect(authService.login(loginData)).rejects.toThrow('A felhasználói fiók inaktív.');
          });
     });

     describe('verifyEmail', () => {
          it('should verify email successfully', async () => {
               const mockUser = { id: 'u1', email: 'test@test.com' };
               (authUtils.hashToken as jest.Mock).mockReturnValue('hashedToken');
               (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

               const result = await authService.verifyEmail('rawToken');

               expect(result.success).toBe(true);
               expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'u1' },
                    data: { isEmailVerified: true, verificationToken: null, verificationTokenExpiry: null }
               });
          });

          it('should throw BadRequestError for invalid token', async () => {
               (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

               await expect(authService.verifyEmail('invalid')).rejects.toThrow('Érvénytelen vagy lejárt megerősítő token.');
          });
     });

     describe('resetPassword', () => {
          it('should reset password successfully', async () => {
               const mockUser = { id: 'u1', isActive: true };
               (authUtils.hashToken as jest.Mock).mockReturnValue('hashedToken');
               (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
               (authUtils.hashPassword as jest.Mock).mockResolvedValue('newHashedPassword');

               const result = await authService.resetPassword('token', 'newPassword');

               expect(result.success).toBe(true);
               expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'u1' },
                    data: { password: 'newHashedPassword', passwordResetToken: null, tokenExpiry: null }
               });
          });
     });
});
