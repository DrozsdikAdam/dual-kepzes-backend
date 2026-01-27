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
}

export const authService = new AuthService();
