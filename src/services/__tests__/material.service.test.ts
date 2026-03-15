import { MaterialService } from '../material.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  materialCompletion: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

describe('MaterialService', () => {
    
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markAsCompleted', () => {
    it('should successfully create a material completion', async () => {
      mockPrisma.materialCompletion.findUnique.mockResolvedValue(null);
      mockPrisma.materialCompletion.create.mockResolvedValue({
        id: '1',
        materialId: 'anyag-1',
        studentProfileId: 'student-1',
        rating: 5,
        isCompleted: true,
        completedAt: new Date(),
      });

      const result = await MaterialService.markAsCompleted('student-1', 'anyag-1', 5);

      expect(mockPrisma.materialCompletion.findUnique).toHaveBeenCalledWith({
        where: {
          studentProfileId_materialId: {
              studentProfileId: 'student-1',
              materialId: 'anyag-1',
          }
        }
      });
      expect(mockPrisma.materialCompletion.create).toHaveBeenCalledWith({
        data: {
          studentProfileId: 'student-1',
          materialId: 'anyag-1',
          rating: 5,
          isCompleted: true,
        }
      });
      expect(result.id).toBe('1');
    });

    it('should throw an error if the material is already completed', async () => {
        mockPrisma.materialCompletion.findUnique.mockResolvedValue({
            id: '1',
            materialId: 'anyag-1',
            studentProfileId: 'student-1',
            rating: 5,
            isCompleted: true,
            completedAt: new Date(),
        });

      await expect(MaterialService.markAsCompleted('student-1', 'anyag-1', 5))
        .rejects
        .toThrow('A(z) anyag-1 azonosítóhoz tartozó tananyagot már elvégezte a diák.');

      expect(mockPrisma.materialCompletion.create).not.toHaveBeenCalled();
    });
  });

  describe('getStudentProgress', () => {
    it('should return a list of completed materials for a student', async () => {
        const mockProgress = [
            { materialId: 'anyag-1', rating: 5 },
            { materialId: 'anyag-2', rating: null },
        ];
        
        mockPrisma.materialCompletion.findMany.mockResolvedValue(mockProgress);

        const result = await MaterialService.getStudentProgress('student-1');

        expect(mockPrisma.materialCompletion.findMany).toHaveBeenCalledWith({
            where: { studentProfileId: 'student-1' },
            orderBy: { completedAt: 'desc' },
        });

        expect(result).toEqual(mockProgress);
    });
  });

  describe('getGeneralStatistics', () => {
    it('should return general statistics for materials', async () => {
        const mockStats = [
            { materialId: 'anyag-1', _count: { _all: 10 }, _avg: { rating: 4.567 } },
            { materialId: 'anyag-2', _count: { _all: 5 }, _avg: { rating: null } },
        ];

        mockPrisma.materialCompletion.groupBy.mockResolvedValue(mockStats);

        const result = await MaterialService.getGeneralStatistics();

        expect(mockPrisma.materialCompletion.groupBy).toHaveBeenCalledWith({
            by: ['materialId'],
            _count: { _all: true },
            _avg: { rating: true },
            orderBy: { materialId: 'asc' },
        });

        expect(result[0].completionsCount).toBe(10);
        expect(result[0].averageRating).toBe(4.57); // kerekítést is teszteljük

        expect(result[1].completionsCount).toBe(5);
        expect(result[1].averageRating).toBeNull();
    });
  });

});
