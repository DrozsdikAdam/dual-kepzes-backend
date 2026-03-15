import { PrismaClient } from '@prisma/client';
import { MaterialCompletion } from '@prisma/client';

const prisma = new PrismaClient();

export class MaterialService {
  /**
   * Tananyag elvégzésének rögzítése egy diák számára
   */
  static async markAsCompleted(studentProfileId: string, materialId: string, rating?: number): Promise<MaterialCompletion> {
    // 1. Ellenőrizzük, hogy létezik-e már a bejegyzés
    const existingCompletion = await prisma.materialCompletion.findUnique({
      where: {
        studentProfileId_materialId: {
          studentProfileId,
          materialId,
        },
      },
    });

    if (existingCompletion) {
      throw new Error(`A(z) ${materialId} azonosítóhoz tartozó tananyagot már elvégezte a diák.`);
    }

    // 2. Új bejegyzés létrehozása
    return prisma.materialCompletion.create({
      data: {
        studentProfileId,
        materialId,
        rating,
        isCompleted: true,
      },
    });
  }

  /**
   * Egy adott diák által elvégzett tananyagok és értékeléseik lekérdezése
   */
  static async getStudentProgress(studentProfileId: string): Promise<MaterialCompletion[]> {
    return prisma.materialCompletion.findMany({
      where: {
        studentProfileId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }

  /**
   * Adminisztrátori statisztikák lekérdezése
   * Visszaadja materialId-nként az elvégzések számát és az átlagos értékelést.
   */
  static async getGeneralStatistics() {
    const stats = await prisma.materialCompletion.groupBy({
      by: ['materialId'],
      _count: {
        _all: true,
      },
      _avg: {
        rating: true,
      },
      orderBy: {
        materialId: 'asc',
      },
    });

    return stats.map(stat => ({
      materialId: stat.materialId,
      completionsCount: stat._count._all,
      averageRating: stat._avg.rating !== null ? Number(stat._avg.rating.toFixed(2)) : null,
    }));
  }
}
