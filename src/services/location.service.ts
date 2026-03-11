import prisma from '../config/prisma';

export class LocationService {
     async getAll() {
          return await prisma.location.findMany({
               where: {
                    companyId: { not: null }
               },
               select: {
                    id: true,
                    country: true,
                    zipCode: true,
                    city: true,
                    address: true,
                    company: {
                         select: {
                              id: true,
                              name: true
                         }
                    },
                    _count: {
                         select: {
                              positions: true
                         }
                    }
               },
               orderBy: { city: 'asc' }
          });
     }
}

export const locationService = new LocationService();

