import prisma from "../config/prisma";

/**
 * 
 * @param userId 
 * @returns {Promise<string | null>}
 */
export const getCompanyIdForUser = async (userId: string): Promise<string | null> => {
     const employee = await prisma.companyEmployee.findUnique({
          where: { userId },
          select: { companyId: true, deletedAt: true }, // Select deletedAt to verify validity if needed
     });

     if (employee && !employee.deletedAt) {
          return employee.companyId;
     }

     return null;
};

/**
 * Ellenőrzi, hogy a pozíció a felhasználó cégéhez tartozik-e
 * @param userId A bejelentkezett felhasználó ID-ja
 * @param positionId Az ellenőrizendő pozíció ID-ja
 * @returns {Promise<boolean>} true, ha a pozíció a felhasználó cégéhez tartozik
 */
export const checkPositionOwnership = async (userId: string, positionId: string): Promise<boolean> => {
     const companyId = await getCompanyIdForUser(userId);

     if (!companyId) {
          return false;
     }

     const position = await prisma.position.findFirst({
          where: {
               id: positionId,
               companyId,
               deletedAt: null
          },
          select: { id: true }
     });

     return !!position;
};
