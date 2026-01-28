import prisma from '../config/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { RegisterInput, LoginInput } from '../schemas/authSchema';
import { BadRequestError, UnauthorizedError } from '../errors/AppError';
import { Role } from '@prisma/client';

export class AuthService {
     async register(data: RegisterInput) {
          const existingUser = await prisma.user.findUnique({
               where: { email: data.email }
          });

          if (existingUser) {
               throw new BadRequestError('A megadott email címmel már létezik felhasználó.');
          }

          const hashedPassword = await hashPassword(data.password);

          return await prisma.$transaction(async (tx) => {
               const user = await tx.user.create({
                    data: {
                         email: data.email,
                         password: hashedPassword,
                         fullName: data.fullName,
                         phoneNumber: data.phoneNumber,
                         role: data.role
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
                                        create: {
                                             country: data.location?.country || "Magyarország",
                                             zipCode: data.location?.zipCode ? String(data.location.zipCode) : "",
                                             city: data.location?.city || "",
                                             address: data.location?.address || ""
                                        }
                                   },
                                   highSchool: data.highSchool!,
                                   graduationYear: data.graduationYear!,
                                   neptunCode: data.neptunCode,
                                   currentMajor: data.currentMajor!,
                                   studyMode: data.studyMode!,
                                   hasLanguageCert: Boolean(data.hasLanguageCert)
                              }
                         });
                         break;
                    case Role.MENTOR:
                    case Role.COMPANY_ADMIN:
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
                    case Role.SYSTEM_ADMIN:
                         // No extra data needed for now
                         break;
                    default:
                         throw new BadRequestError('Ismeretlen szerepkör a regisztráció során');
               }

               return user;
          });
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

     async requestPasswordReset(email: string) {
          const user = await prisma.user.findUnique({
               where: { email }
          });

          // Ne áruljon el, hogy létezik-e a felhasználó (biztonsági ok)
          if (!user) {
               return { success: true, message: 'Ha a megadott email cím regisztrálva van, elküldtük a jelszó visszaállító linket.' };
          }

          // Token generálás és hash
          const { generateResetToken, hashToken } = require('../utils/auth');
          const resetToken = generateResetToken();
          const hashedToken = hashToken(resetToken);

          // Token tárolása 1 órás lejárattal (UTC időben)
          // Használjunk milliszekundumot a pontosság érdekében
          const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // +1 óra

          await prisma.user.update({
               where: { id: user.id },
               data: {
                    passwordResetToken: hashedToken,
                    tokenExpiry: tokenExpiry
               }
          });

          // Email küldés
          const { generatePasswordResetEmail } = require('../utils/emailTemplates');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
          const emailHtml = generatePasswordResetEmail(resetUrl, user.fullName);

          const { addEmailToQueue } = require('./emailQueue');

          // Notification létrehozása
          const notification = await prisma.notification.create({
               data: {
                    userId: user.id,
                    title: 'Jelszó visszaállítás',
                    message: 'Jelszó visszaállítási kérést kaptunk a fiókodhoz.',
                    type: 'PASSWORD_RESET',
                    status: 'PENDING'
               }
          });

          await addEmailToQueue({
               notificationId: notification.id,
               email: user.email,
               subject: 'Jelszó visszaállítás - Duális Képzés',
               body: emailHtml
          });

          return { success: true, message: 'Ha a megadott email cím regisztrálva van, elküldtük a jelszó visszaállító linket.' };
     }

     async resetPassword(token: string, newPassword: string) {
          const { hashToken, hashPassword } = require('../utils/auth');
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

          // Új jelszó hash-elése
          const hashedPassword = await hashPassword(newPassword);

          // Jelszó frissítése és token törlése
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
}

export const authService = new AuthService();

