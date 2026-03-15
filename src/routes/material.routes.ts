import { Router } from 'express';
import { materialController } from '../controllers/material.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { validate } from '../middlewares/validate.middleware';
import { CompleteMaterialSchema } from '../schemas/material.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Learning Materials
 *   description: Tananyagok (Learning Materials) és azok elvégzésének dokumentációja
 */

/**
 * @swagger
 * /api/materials/complete:
 *   post:
 *     summary: Tananyag elvégzésének és értékelésének rögzítése
 *     tags: [Learning Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialId
 *             properties:
 *               materialId:
 *                 type: string
 *                 example: "anyag-elso"
 *                 description: A tananyag azonosítója
 *               rating:
 *                 type: integer
 *                 example: 5
 *                 description: Opcionális értékelés 1-5 között
 *     responses:
 *       201:
 *         description: Sikeresen mentve.
 *       400:
 *         description: Hiányzó vagy hibás adat (pl. érvénytelen értékelés).
 *       403:
 *         description: Hozzáférés megtagadva (csak diákok rögzíthetnek).
 *       409:
 *         description: A diák már rögzítette egyszer ezt a tananyagot.
 */
router.post('/complete', authenticateToken, requireRole([Role.STUDENT]), validate(CompleteMaterialSchema), materialController.completeMaterial);

/**
 * @swagger
 * /api/materials/progress:
 *   get:
 *     summary: Diák saját előrehaladásának listázása
 *     tags: [Learning Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sikeres válasz, a letöltött tananyagok elvégzéseivel.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   materialId:
 *                     type: string
 *                     example: "anyag-kettes"
 *                   rating:
 *                     type: integer
 *                     example: 4
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-21T10:00:00.000Z"
 *       403:
 *         description: Hozzáférés megtagadva.
 */
router.get('/progress', authenticateToken, requireRole([Role.STUDENT]), materialController.getMyProgress);

/**
 * @swagger
 * /api/materials/statistics:
 *   get:
 *     summary: Tananyag statisztikák lekérdezése az összes diákra
 *     tags: [Learning Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sikeres válasz statisztikákkal.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   materialId:
 *                     type: string
 *                     example: "anyag-kettes"
 *                   completionsCount:
 *                     type: integer
 *                     example: 42
 *                   averageRating:
 *                     type: number
 *                     example: 4.5
 *       403:
 *         description: Hozzáférés megtagadva (csak adminok és mentorok számára).
 */
router.get('/statistics', authenticateToken, requireRole([Role.SYSTEM_ADMIN, Role.MENTOR, Role.COMPANY_ADMIN]), materialController.getStatistics);

export default router;
