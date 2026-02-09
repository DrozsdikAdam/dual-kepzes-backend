/**
 * 🛡️ Never Trust The Client - Ownership Middleware
 * 
 * Általános middleware a tulajdonjog ellenőrzésére.
 * Biztosítja, hogy a felhasználó csak a saját erőforrásait tudja módosítani.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { getCompanyIdForUser } from '../utils/company.util';
import { logOwnershipViolation } from '../utils/security-logger.util';

/**
 * Erőforrás típusok, amelyekre ownership ellenőrzés végezhető
 */
export type ResourceType =
     | 'position'
     | 'application'
     | 'partnership'
     | 'studentProfile'
     | 'companyEmployee'
     | 'company'
     | 'notification';

/**
 * Az erőforrás ID forrása a request-ben
 */
export type IdSource = 'params' | 'body' | 'query';

/**
 * Ownership ellenőrzési konfiguráció
 */
interface OwnershipConfig {
     resourceType: ResourceType;
     idParam?: string;         // A paraméter neve (default: 'id')
     idSource?: IdSource;      // Honnan jön az ID (default: 'params')
     allowSystemAdmin?: boolean; // SYSTEM_ADMIN bypass (default: true)
}

/**
 * Általános ownership ellenőrzés middleware
 * 
 * Használat:
 * router.put('/positions/:id', authenticateToken, requireOwnership({ resourceType: 'position' }), updatePosition);
 */
export function requireOwnership(config: OwnershipConfig) {
     const {
          resourceType,
          idParam = 'id',
          idSource = 'params',
          allowSystemAdmin = true
     } = config;

     return async (req: Request, res: Response, next: NextFunction) => {
          try {
               const userId = req.user?.userId;

               if (!userId) {
                    throw new ForbiddenError('Nem vagy bejelentkezve.');
               }

               // SYSTEM_ADMIN bypass, ha engedélyezve van
               if (allowSystemAdmin && req.user?.role === 'SYSTEM_ADMIN') {
                    return next();
               }

               // Erőforrás ID kinyerése
               const resourceId = getResourceId(req, idParam, idSource);

               if (!resourceId) {
                    throw new ForbiddenError('Hiányzó erőforrás azonosító.');
               }

               // Ownership ellenőrzés típus alapján
               const hasOwnership = await checkOwnership(resourceType, resourceId, userId);

               if (!hasOwnership) {
                    // 🛡️ Biztonsági logolás
                    await logOwnershipViolation(req, resourceType, resourceId);

                    throw new ForbiddenError('Nincs jogosultságod ehhez az erőforráshoz.');
               }

               next();
          } catch (error) {
               next(error);
          }
     };
}

/**
 * Erőforrás ID kinyerése a request-ből
 */
function getResourceId(req: Request, idParam: string, idSource: IdSource): string | undefined {
     switch (idSource) {
          case 'params':
               return req.params[idParam];
          case 'body':
               return req.body[idParam];
          case 'query':
               return req.query[idParam] as string;
          default:
               return undefined;
     }
}

/**
 * Ownership ellenőrzés típus alapján
 */
async function checkOwnership(
     resourceType: ResourceType,
     resourceId: string,
     userId: string
): Promise<boolean> {
     switch (resourceType) {
          case 'position':
               return await checkPositionOwnership(resourceId, userId);

          case 'application':
               return await checkApplicationOwnership(resourceId, userId);

          case 'partnership':
               return await checkPartnershipOwnership(resourceId, userId);

          case 'studentProfile':
               return await checkStudentProfileOwnership(resourceId, userId);

          case 'companyEmployee':
               return await checkCompanyEmployeeOwnership(resourceId, userId);

          case 'company':
               return await checkCompanyOwnership(resourceId, userId);

          case 'notification':
               return await checkNotificationOwnership(resourceId, userId);

          default:
               return false;
     }
}

/**
 * Pozíció tulajdonjog ellenőrzése (céges felhasználónak)
 */
async function checkPositionOwnership(positionId: string, userId: string): Promise<boolean> {
     const companyId = await getCompanyIdForUser(userId);

     if (!companyId) return false;

     const position = await prisma.position.findFirst({
          where: {
               id: positionId,
               companyId,
               deletedAt: null
          },
          select: { id: true }
     });

     return !!position;
}

/**
 * Jelentkezés tulajdonjog ellenőrzése (diák vagy céges felhasználó)
 */
async function checkApplicationOwnership(applicationId: string, userId: string): Promise<boolean> {
     // Diák ellenőrzése
     const studentProfile = await prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true }
     });

     if (studentProfile) {
          const studentApp = await prisma.application.findFirst({
               where: {
                    id: applicationId,
                    studentId: studentProfile.id,
                    deletedAt: null
               },
               select: { id: true }
          });

          if (studentApp) return true;
     }

     // Céges felhasználó ellenőrzése
     const companyId = await getCompanyIdForUser(userId);

     if (companyId) {
          const companyApp = await prisma.application.findFirst({
               where: {
                    id: applicationId,
                    position: { companyId },
                    deletedAt: null
               },
               select: { id: true }
          });

          if (companyApp) return true;
     }

     return false;
}

/**
 * Partnerség tulajdonjog ellenőrzése
 */
async function checkPartnershipOwnership(partnershipId: string, userId: string): Promise<boolean> {
     // Diák ellenőrzése
     const studentProfile = await prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true }
     });

     if (studentProfile) {
          const studentPartnership = await prisma.dualPartnership.findFirst({
               where: {
                    id: partnershipId,
                    studentId: studentProfile.id,
                    deletedAt: null
               },
               select: { id: true }
          });

          if (studentPartnership) return true;
     }

     // Céges felhasználó (mentor vagy céges admin) ellenőrzése
     const companyId = await getCompanyIdForUser(userId);

     if (companyId) {
          const companyPartnership = await prisma.dualPartnership.findFirst({
               where: {
                    id: partnershipId,
                    OR: [
                         { mentor: { companyId } },
                         { position: { companyId } }
                    ],
                    deletedAt: null
               },
               select: { id: true }
          });

          if (companyPartnership) return true;
     }

     return false;
}

/**
 * Hallgatói profil tulajdonjog ellenőrzése
 */
async function checkStudentProfileOwnership(profileId: string, userId: string): Promise<boolean> {
     const profile = await prisma.studentProfile.findFirst({
          where: {
               id: profileId,
               userId,
               deletedAt: null
          },
          select: { id: true }
     });

     return !!profile;
}

/**
 * Céges alkalmazott tulajdonjog ellenőrzése
 */
async function checkCompanyEmployeeOwnership(employeeId: string, userId: string): Promise<boolean> {
     // Saját profil ellenőrzése
     const ownProfile = await prisma.companyEmployee.findFirst({
          where: {
               id: employeeId,
               userId,
               deletedAt: null
          },
          select: { id: true }
     });

     if (ownProfile) return true;

     // Céges admin ellenőrzése (módosíthatja a saját cég dolgozóit)
     const adminCompanyId = await getCompanyIdForUser(userId);

     if (adminCompanyId) {
          const employee = await prisma.companyEmployee.findFirst({
               where: {
                    id: employeeId,
                    companyId: adminCompanyId,
                    deletedAt: null
               },
               select: { id: true }
          });

          if (employee) return true;
     }

     return false;
}

/**
 * Cég tulajdonjog ellenőrzése (céges admin)
 */
async function checkCompanyOwnership(companyId: string, userId: string): Promise<boolean> {
     const userCompanyId = await getCompanyIdForUser(userId);
     return userCompanyId === companyId;
}

/**
 * Értesítés tulajdonjog ellenőrzése
 */
async function checkNotificationOwnership(notificationId: string, userId: string): Promise<boolean> {
     const notification = await prisma.notification.findFirst({
          where: {
               id: notificationId,
               userId,
               deletedAt: null
          },
          select: { id: true }
     });

     return !!notification;
}

/**
 * Előre definiált ownership middleware-ek gyakori használati esetekhez
 */
export const requirePositionOwnership = requireOwnership({ resourceType: 'position' });
export const requireApplicationOwnership = requireOwnership({ resourceType: 'application' });
export const requirePartnershipOwnership = requireOwnership({ resourceType: 'partnership' });
export const requireStudentProfileOwnership = requireOwnership({ resourceType: 'studentProfile' });
export const requireCompanyEmployeeOwnership = requireOwnership({ resourceType: 'companyEmployee' });
export const requireCompanyOwnership = requireOwnership({ resourceType: 'company' });
export const requireNotificationOwnership = requireOwnership({ resourceType: 'notification' });
