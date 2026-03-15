import { Request, Response } from 'express';
import { MaterialService } from '../services/material.service';

export const materialController = {
  /**
   * Új tananyag elvégzése vagy meglévő értékelése
   */
  async completeMaterial(req: Request, res: Response) {
    try {
      const studentProfileId = req.user?.studentProfileId;

      if (!studentProfileId) {
        return res.status(403).json({ message: 'Hozzáférés megtagadva: csak diákok számára elérhető.' });
      }

      const { materialId, rating } = req.body;

      const completion = await MaterialService.markAsCompleted(studentProfileId, materialId, rating);
      return res.status(201).json(completion);

    } catch (error) {
      if (error instanceof Error && error.message.includes('már elvégezte')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Belső szerverhiba', error: error instanceof Error ? error.message : String(error) });
    }
  },

  /**
   * Saját tananyag elvégzéseinek letöltése
   */
  async getMyProgress(req: Request, res: Response) {
    try {
      const studentProfileId = (req as any).user?.studentProfileId || (req.user as any)?.studentProfileId;

      if (!studentProfileId) {
        return res.status(403).json({ message: 'Hozzáférés megtagadva: csak diákok számára elérhető.' });
      }

      const progress = await MaterialService.getStudentProgress(studentProfileId);
      return res.status(200).json(progress);

    } catch (error) {
      return res.status(500).json({ message: 'Belső szerverhiba', error: error instanceof Error ? error.message : String(error) });
    }
  },

  /**
   * Általános statisztikák az elvégzésekről.
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await MaterialService.getGeneralStatistics();
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: 'Belső szerverhiba', error: error instanceof Error ? error.message : String(error) });
    }
  }

};
