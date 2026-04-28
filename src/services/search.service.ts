import prisma from '../config/prisma';
import { mapPosition, mapCompany } from '../utils/mapper.util';

export class SearchService {
    async globalSearch(query: string, limit: number = 10) {
        const [positionsRaw, companiesRaw, newsRaw] = await Promise.all([
            // 1. Pozíciók keresése
            prisma.position.findMany({
                where: {
                    isActive: true,
                    deletedAt: null,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { company: { name: { contains: query, mode: 'insensitive' } } },
                        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } }
                    ]
                },
                include: {
                    company: {
                        include: {
                            location: true
                        }
                    },
                    location: true,
                    major: true,
                    tags: {
                        select: {
                            name: true,
                            category: true
                        }
                    }
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),

            // 2. Cégek keresése
            prisma.company.findMany({
                where: {
                    isActive: true,
                    status: 'APPROVED',
                    deletedAt: null,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    location: true,
                    positions: {
                        where: {
                            isActive: true,
                            deletedAt: null
                        },
                        include: {
                            location: true,
                            tags: {
                                select: {
                                    name: true,
                                    category: true
                                }
                            },
                            major: true
                        }
                    }
                },
                take: limit,
                orderBy: { name: 'asc' }
            }),

            // 3. Hírek keresése
            prisma.news.findMany({
                where: {
                    isArchived: false,
                    deletedAt: null,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return {
            positions: positionsRaw.map(mapPosition).filter(p => p !== null),
            companies: companiesRaw.map(mapCompany).filter(c => c !== null),
            news: newsRaw
        };
    }
}

export const searchService = new SearchService();
