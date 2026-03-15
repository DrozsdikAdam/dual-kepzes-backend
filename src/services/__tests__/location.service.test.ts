import { locationService } from '../location.service';
import prisma from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
     __esModule: true,
     default: {
          location: {
               findMany: jest.fn(),
          },
     },
}));

describe('LocationService', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('getAll', () => {
          it('should return all locations with company info and position count', async () => {
               const mockLocations = [
                    {
                         id: 'loc1',
                         country: 'Magyarország',
                         zipCode: '1111',
                         city: 'Budapest',
                         address: 'Fő utca 1.',
                         company: { id: 'c1', name: 'Test Kft.' },
                         _count: { positions: 3 },
                    },
                    {
                         id: 'loc2',
                         country: 'Magyarország',
                         zipCode: '4032',
                         city: 'Debrecen',
                         address: 'Egyetem tér 1.',
                         company: { id: 'c2', name: 'Másik Kft.' },
                         _count: { positions: 0 },
                    },
               ];
               (prisma.location.findMany as jest.Mock).mockResolvedValue(mockLocations);

               const result = await locationService.getAll();

               expect(result).toEqual(mockLocations);
               expect(prisma.location.findMany).toHaveBeenCalledWith({
                    where: { companyId: { not: null } },
                    select: {
                         id: true,
                         country: true,
                         zipCode: true,
                         city: true,
                         address: true,
                         company: {
                              select: {
                                   id: true,
                                   name: true,
                              },
                         },
                         _count: {
                              select: {
                                   positions: true,
                              },
                         },
                    },
                    orderBy: { city: 'asc' },
               });
          });

          it('should return empty array when no locations exist', async () => {
               (prisma.location.findMany as jest.Mock).mockResolvedValue([]);

               const result = await locationService.getAll();

               expect(result).toEqual([]);
               expect(prisma.location.findMany).toHaveBeenCalledTimes(1);
          });

          it('should only return locations with a companyId', async () => {
               (prisma.location.findMany as jest.Mock).mockResolvedValue([]);

               await locationService.getAll();

               expect(prisma.location.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                         where: { companyId: { not: null } },
                    })
               );
          });

          it('should order results by city ascending', async () => {
               (prisma.location.findMany as jest.Mock).mockResolvedValue([]);

               await locationService.getAll();

               expect(prisma.location.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                         orderBy: { city: 'asc' },
                    })
               );
          });

          it('should propagate database errors', async () => {
               (prisma.location.findMany as jest.Mock).mockRejectedValue(new Error('DB connection error'));

               await expect(locationService.getAll()).rejects.toThrow('DB connection error');
          });
     });
});
