import { Prisma } from '@prisma/client';

export const locationSelectDto = Prisma.validator<Prisma.LocationSelect>()({
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
});

export type LocationDto = Prisma.LocationGetPayload<{ select: typeof locationSelectDto }>;
