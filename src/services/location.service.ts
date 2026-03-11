import prisma from '../config/prisma';

export class LocationService {
     async getAll() {
          const locations = await prisma.location.findMany({
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

          return locations.map(loc => ({
               id: loc.id,
               country: loc.country,
               zipCode: loc.zipCode,
               city: loc.city,
               address: loc.address,
               company: loc.company,
               positionCount: loc._count.positions
          }));
     }
}

export const locationService = new LocationService();
