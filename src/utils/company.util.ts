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
