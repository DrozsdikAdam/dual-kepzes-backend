import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { Role } from '@prisma/client';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination';

export class StudentService {
     private studentSelect = {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          studentProfile: {
               select: {
                    id: true,
                    mothersName: true,
                    birthDate: true,
                    locations: {
                         select: {
                              id: true,
                              country: true,
                              zipCode: true,
                              city: true,
                              address: true
                         }
                    },
                    highSchool: true,
                    graduationYear: true,
                    neptunCode: true,
                    currentMajor: true,
                    studyMode: true,
                    hasLanguageCert: true
               }
          }
     };

     async getProfile(userId: string) {
          const student = await prisma.user.findUnique({
               where: { id: userId, role: Role.STUDENT },
               select: this.studentSelect
          });

          if (!student) {
               throw new NotFoundError('Hallgatói profil');
          }

          return student;
     }

     async getAll(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = { role: Role.STUDENT };

          return await paginate(
               params,
               prisma.user.findMany({
                    where,
                    select: this.studentSelect,
                    orderBy: { createdAt: 'desc' as const },
                    skip,
                    take
               }),
               prisma.user.count({ where })
          );
     }

     async updateProfile(userId: string, data: any) {
          const { fullName, phoneNumber, ...profileData } = data;
          const { location, ...otherProfileData } = profileData;

          const currentUser = await prisma.user.findUnique({
               where: { id: userId },
               select: { studentProfile: { select: { locations: true } } }
          });

          if (!currentUser?.studentProfile) {
               throw new NotFoundError('Hallgatói profil');
          }

          const existingLocation = currentUser.studentProfile.locations?.[0];
          const locationsUpdate = this.prepareLocationUpdate(existingLocation, location);

          return await prisma.user.update({
               where: { id: userId },
               data: {
                    fullName,
                    phoneNumber,
                    studentProfile: {
                         update: {
                              ...otherProfileData,
                              locations: locationsUpdate
                         }
                    }
               },
               select: this.studentSelect
          });
     }

     async deleteProfile(userId: string) {
          return await prisma.user.update({
               where: { id: userId },
               data: {
                    isActive: false,
                    deletedAt: new Date(),
                    studentProfile: {
                         update: { deletedAt: new Date() }
                    }
               }
          });
     }

     private prepareLocationUpdate(existingLocation: any, newLocation: any) {
          if (!newLocation) return undefined;

          if (existingLocation) {
               return {
                    update: {
                         where: { id: existingLocation.id },
                         data: {
                              country: newLocation.country || existingLocation.country,
                              zipCode: newLocation.zipCode ? String(newLocation.zipCode) : existingLocation.zipCode,
                              city: newLocation.city || existingLocation.city,
                              address: newLocation.address || existingLocation.address
                         }
                    }
               };
          } else {
               return {
                    create: {
                         country: newLocation.country || "Magyarország",
                         zipCode: newLocation.zipCode ? String(newLocation.zipCode) : "",
                         city: newLocation.city || "",
                         address: newLocation.address || ""
                    }
               };
          }
     }
}

export const studentService = new StudentService();
