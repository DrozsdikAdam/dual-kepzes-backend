import prisma from '../config/prisma';
import { hashPassword, comparePassword, generateToken, generateResetToken, hashToken } from '../utils/auth.util';
import { RegisterInput, LoginInput, CompanyAdminRegisterInput, SystemAdminRegisterInput } from '../schemas/auth.schema';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { Role, User } from '@prisma/client';
import { generateVerificationEmail, generatePasswordResetEmail } from '../utils/email.util';
import { addEmailToQueue } from './email.queue';
import { notificationService } from './notification.service';
import { prepareLocationData } from '../utils/location.util';
import { NOTIFICATION_TYPES, SECURITY } from '../utils/constants';

export class AuthService {
     async register(data: RegisterInput) {
          await this.ensureEmailNotTaken(data.email);

          const hashedPassword = await hashPassword(data.password);

          const result = await prisma.$transaction(async (tx) => {
               const user = await tx.user.create({
                    data: {
                         email: data.email,
                         password: hashedPassword,
                         fullName: data.fullName,
                         phoneNumber: data.phoneNumber,
                         role: data.role,
                         isEmailVerified: true
                    }
               });

               switch (data.role) {
                    case Role.STUDENT:
                         await tx.studentProfile.create({
                              data: {
                                   userId: user.id,
                                   mothersName: data.mothersName!,
                                   birthDate: data.dateOfBirth!,
                                   locations: {
                                        create: data.location ? prepareLocationData(data.location) : {
                                             country: "Magyarország",
                                             zipCode: "",
                                             city: "",
                                             address: ""
                                        }
                                   },
                                   highSchool: data.highSchool!,
                                   graduationYear: data.graduationYear!,
                                   neptunCode: data.neptunCode,
                                   majorId: data.majorId,
                                   studyMode: data.studyMode!,
                                   hasLanguageCert: Boolean(data.hasLanguageCert),
                                   isInHighSchool: Boolean(data.isInHighSchool),
                                   firstChoiceId: data.firstChoiceId,
                                   secondChoiceId: data.secondChoiceId,
                                   language: data.language,
                                   languageLevel: data.languageLevel
                              }
                         });
                         break;
                    case Role.MENTOR:
                         if (!data.companyId) {
                              throw new BadRequestError(`Cég azonosító kötelező a ${data.role} regisztrációhoz.`);
                         }
                         await tx.companyEmployee.create({
                              data: {
                                   userId: user.id,
                                   companyId: data.companyId,
                                   jobTitle: data.jobTitle
                              }
                         });
                         break;
                    case Role.UNIVERSITY_USER:
                         break;
                    default:
                         throw new BadRequestError('Ismeretlen szerepkör a regisztráció során');
               }

               return user;
          });


          // Verification email sending disabled as per request
          /*
          if (process.env.NODE_ENV !== 'development') {
               await this.sendVerificationEmail(result.id);
          }
          */

          return result;
     }

     async registerCompanyAdmin(data: CompanyAdminRegisterInput) {
          await this.ensureEmailNotTaken(data.email);

          const hashedPassword = await hashPassword(data.password);

          const result = await prisma.$transaction(async (tx) => {
               const user = await tx.user.create({
                    data: {
                         email: data.email,
                         password: hashedPassword,
                         fullName: data.fullName,
                         phoneNumber: data.phoneNumber,
                         role: Role.COMPANY_ADMIN,
                         isEmailVerified: true
                    }
               });

               await tx.companyEmployee.create({
                    data: {
                         userId: user.id,
                         companyId: data.companyId,
                         jobTitle: data.jobTitle
                    }
               });

               return user;
          });

          return result;
     }

     async registerSystemAdmin(data: SystemAdminRegisterInput) {
          await this.ensureEmailNotTaken(data.email);

          const hashedPassword = await hashPassword(data.password);

          const user = await prisma.user.create({
               data: {
                    email: data.email,
                    password: hashedPassword,
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    role: Role.SYSTEM_ADMIN,
                    isEmailVerified: true
               }
          });

          return user;
     }

     async login(data: LoginInput) {
          const user = await prisma.user.findUnique({
               where: { email: data.email }
          });

          if (!user) {
               throw new BadRequestError('Hibás email vagy jelszó.');
          }

          const isValid = await comparePassword(data.password, user.password);
          if (!isValid) {
               throw new BadRequestError('Hibás email vagy jelszó.');
          }

          if (!user.isActive) {
               throw new UnauthorizedError('A felhasználói fiók inaktív.');
          }

          /*
          if (process.env.NODE_ENV !== 'development' && !user.isEmailVerified) {
               throw new UnauthorizedError('Kérjük, előbb erősítsd meg az email címedet.');
          }
          */

          const token = generateToken(user.id, user.role);

          return {
               token,
               user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
               }
          };
     }

     async sendVerificationEmail(userId: string) {
          const user = await prisma.user.findUnique({
               where: { id: userId }
          });

          if (!user) throw new BadRequestError('Felhasználó nem található.');
          if (user.isEmailVerified) throw new BadRequestError('Az email cím már meg van erősítve.');

          const verificationToken = generateResetToken();
          const hashedToken = hashToken(verificationToken);

          // Token 24 óráig érvényes
          const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await prisma.user.update({
               where: { id: userId },
               data: {
                    verificationToken: hashedToken,
                    verificationTokenExpiry: expiry
               }
          });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
          const emailHtml = generateVerificationEmail(verificationUrl, user.fullName);

          const notification = await prisma.notification.create({
               data: {
                    userId: user.id,
                    title: 'Email megerősítés',
                    message: 'Kérjük, erősítsd meg az email címedet a regisztráció befejezéséhez.',
                    type: 'EMAIL_VERIFICATION',
                    status: 'PENDING'
               }
          });

          if (notificationService.shouldSendEmail(user.role, 'EMAIL_VERIFICATION')) {
               await addEmailToQueue({
                    notificationId: notification.id,
                    email: user.email,
                    subject: 'Email megerősítés - Duális Képzés',
                    body: emailHtml
               });
          }

          return { success: true };
     }

     async verifyEmail(token: string) {
          const hashedToken = hashToken(token);

          const user = await prisma.user.findFirst({
               where: {
                    verificationToken: hashedToken,
                    verificationTokenExpiry: { gt: new Date() }
               }
          });

          if (!user) {
               throw new BadRequestError('Érvénytelen vagy lejárt megerősítő token.');
          }

          await prisma.user.update({
               where: { id: user.id },
               data: {
                    isEmailVerified: true,
                    verificationToken: null,
                    verificationTokenExpiry: null
               }
          });

          return { success: true, message: 'Email cím sikeresen megerősítve.', userId: user.id };
     }

     async resendVerification(email: string) {
          const user = await prisma.user.findUnique({
               where: { email }
          });

          if (!user) {
               // Biztonsági okokból ugyanazt a választ adjuk
               return { success: true, message: 'Ha a megadott email cím regisztrálva van, elküldtük a megerősítő levelet.' };
          }

          if (user.isEmailVerified) {
               throw new BadRequestError('Ez az email cím már meg van erősítve.');
          }

          await this.sendVerificationEmail(user.id);

          return { success: true, message: 'A megerősítő levelet újra elküldtük.', userId: user.id };
     }

     async requestPasswordReset(email: string) {
          const user = await prisma.user.findUnique({
               where: { email }
          });

          // Ne áruljon el, hogy létezik-e a felhasználó (biztonsági ok)
          if (!user) {
               return { success: true, message: 'Ha a megadott email cím regisztrálva van, elküldtük a jelszó visszaállító linket.' };
          }

          const resetToken = generateResetToken();
          const hashedToken = hashToken(resetToken);

          // Token tárolása lejárattal (UTC időben)
          const tokenExpiry = new Date(Date.now() + SECURITY.PASSWORD_RESET_EXPIRY_MS);

          await prisma.user.update({
               where: { id: user.id },
               data: {
                    passwordResetToken: hashedToken,
                    tokenExpiry: tokenExpiry
               }
          });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
          const emailHtml = generatePasswordResetEmail(resetUrl, user.fullName);

          const notification = await prisma.notification.create({
               data: {
                    userId: user.id,
                    title: 'Jelszó visszaállítás',
                    message: 'Jelszó visszaállítási kérést kaptunk a fiókodhoz.',
                    type: 'PASSWORD_RESET',
                    status: 'PENDING'
               }
          });

          if (notificationService.shouldSendEmail(user.role, 'PASSWORD_RESET')) {
               await addEmailToQueue({
                    notificationId: notification.id,
                    email: user.email,
                    subject: 'Jelszó visszaállítás - Duális Képzés',
                    body: emailHtml
               });
          }

          return { success: true, message: 'Ha a megadott email cím regisztrálva van, elküldtük a jelszó visszaállító linket.' };
     }

     async resetPassword(token: string, newPassword: string) {
          const hashedToken = hashToken(token);

          const user = await prisma.user.findFirst({
               where: {
                    passwordResetToken: hashedToken,
                    tokenExpiry: {
                         gt: new Date() // Token még nem járt le
                    }
               }
          });

          if (!user) {
               throw new BadRequestError('Érvénytelen vagy lejárt token.');
          }

          if (!user.isActive) {
               throw new UnauthorizedError('A felhasználói fiók inaktív.');
          }

          const hashedPassword = await hashPassword(newPassword);

          await prisma.user.update({
               where: { id: user.id },
               data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    tokenExpiry: null
               }
          });

          return { success: true, message: 'Jelszó sikeresen megváltoztatva.' };
     }

     private async ensureEmailNotTaken(email: string) {
          const existingUser = await prisma.user.findUnique({
               where: { email }
          });

          if (existingUser) {
               throw new BadRequestError('A megadott email címmel már létezik felhasználó.');
          }
     }
}

export const authService = new AuthService();
