import prisma from '../config/prisma';
import { NotFoundError } from '../errors/AppError';
import { Role, Location } from '@prisma/client';
import { PaginationParams, getPrismaSkipTake, paginate } from '../utils/pagination.util';
import { prepareLocationData } from '../utils/location.util';
import { notifySystemAdmins } from '../utils/notification.util';
import { NOTIFICATION_TYPES } from '../utils/constants';
import { StudentUpdateInput, UniversityTransitionInput } from '../schemas/student.schema';
import { notificationService } from './notification.service';
import { addEmailToQueue } from './email.queue';

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
                    highSchoolLocation: true,
                    graduationYear: true,
                    neptunCode: true,
                    majorId: true,
                    major: {
                         select: {
                              id: true,
                              name: true,
                              language: true
                         }
                    },
                    studyMode: true,
                    hasLanguageCert: true,
                    isInHighSchool: true,
                    firstChoiceId: true,
                    firstChoice: {
                         select: {
                              id: true,
                              name: true,
                              language: true
                         }
                    },
                    secondChoiceId: true,
                    secondChoice: {
                         select: {
                              id: true,
                              name: true,
                              language: true
                         }
                    },
                    language: true,
                    languageLevel: true,
                    motivationLetter: true,
                    isAvailableForWork: true
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

     async getAvailableForWork(params: Required<PaginationParams>) {
          const { skip, take } = getPrismaSkipTake(params);
          const where = {
               role: Role.STUDENT,
               isActive: true,
               studentProfile: {
                    isAvailableForWork: true
               }
          };

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

     async updateProfile(userId: string, data: StudentUpdateInput) {
          const { fullName, phoneNumber, location, ...profileData } = data;

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
                              ...profileData,
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

     async transitionToUniversity(userId: string, data: UniversityTransitionInput) {
          const updated = await prisma.user.update({
               where: { id: userId },
               data: {
                    studentProfile: {
                         update: {
                              neptunCode: data.neptunCode,
                              majorId: data.majorId,
                              graduationYear: data.graduationYear,
                              isInHighSchool: false,
                              firstChoiceId: null,
                              secondChoiceId: null
                         }
                    }
               },
               select: this.studentSelect
          });

          // Background notification to admins
          notifySystemAdmins({
               title: "Egyetemi profil váltás",
               message: `${updated.fullName || 'Hallgató'} átváltott középiskolai profilról egyetemire (Neptun: ${data.neptunCode}).`,
               type: NOTIFICATION_TYPES.STUDENT_TRANSITION
          }).catch(err => console.error('[StudentService.transitionToUniversity] Notification error:', err));

          return updated;
     }

     async toggleAvailableForWork(userId: string) {
          const user = await prisma.user.findUnique({
               where: { id: userId, role: Role.STUDENT },
               select: { studentProfile: { select: { isAvailableForWork: true } } }
          });

          if (!user?.studentProfile) {
               throw new NotFoundError('Hallgatói profil');
          }

          return await prisma.user.update({
               where: { id: userId },
               data: {
                    studentProfile: {
                         update: {
                              isAvailableForWork: !user.studentProfile.isAvailableForWork
                         }
                    }
               },
               select: this.studentSelect
          });
     }

     async expressInterest(studentId: string, interestedUserId: string, message?: string) {
          const student = await prisma.user.findUnique({
               where: { id: studentId, role: Role.STUDENT },
               select: { id: true, email: true, fullName: true }
          });

          if (!student) {
               throw new NotFoundError('Hallgatói profil');
          }

          const interestedUser = await prisma.user.findUnique({
               where: { id: interestedUserId },
               select: { fullName: true, email: true }
          });

          if (!interestedUser) {
               throw new NotFoundError('Érdeklődő felhasználó');
          }

          const notificationTitle = "Érdeklődés";
          const notificationMessage = `${interestedUser.fullName} (${interestedUser.email}) érdeklődik irántad.${message ? `\n\nÜzenet:\n${message}` : ""}`;

          const notification = await notificationService.create({
               userId: studentId,
               title: notificationTitle,
               message: notificationMessage,
               type: NOTIFICATION_TYPES.STUDENT_INTEREST
          });

          // Send email
          await addEmailToQueue({
               notificationId: notification.id,
               email: student.email,
               subject: notificationTitle,
               body: notificationMessage
          });

          return { success: true };
     }

     private prepareLocationUpdate(existingLocation: Location | undefined, newLocation: StudentUpdateInput['location']) {
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
                    create: prepareLocationData(newLocation as any)
               };
          }
     }
}

export const studentService = new StudentService();
