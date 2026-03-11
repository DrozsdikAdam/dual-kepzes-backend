import prisma from '../config/prisma';
import { locationSelectDto } from '../dtos/location.dto';

export class LocationService {
     async getAll() {
          const locations = await prisma.location.findMany({
               where: {
                    companyId: { not: null }
               },
               select: locationSelectDto,
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
