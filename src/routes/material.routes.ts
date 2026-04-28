import { Router } from 'express';
import { Role } from '@prisma/client';
import { materialController } from '../controllers/material.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { CompleteMaterialSchema } from '../schemas/material.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Learning Materials
 *   description: Learning material completion and statistics
 */

/**
 * @swagger
 * /api/materials/complete:
 *   post:
 *     summary: Record completion of a learning material
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
 *                 example: material-intro
 *                 description: Identifier of the learning material
 *               rating:
 *                 type: integer
 *                 example: 5
 *                 description: Optional rating given by the student
 *     responses:
 *       201:
 *         description: Learning material completion recorded successfully
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Only students can record completion
 *       409:
 *         description: Material completion already exists for this student
 */
router.post(
    '/complete',
    authenticateToken,
    requireRole([Role.STUDENT]),
    validate(CompleteMaterialSchema),
    materialController.completeMaterial
);

/**
 * @swagger
 * /api/materials/progress:
 *   get:
 *     summary: List the current student's completed learning materials
 *     tags: [Learning Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed materials for the current student
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   materialId:
 *                     type: string
 *                     example: material-advanced
 *                   rating:
 *                     type: integer
 *                     example: 4
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-21T10:00:00.000Z"
 *       403:
 *         description: Access denied
 */
router.get(
    '/progress',
    authenticateToken,
    requireRole([Role.STUDENT]),
    materialController.getMyProgress
);

/**
 * @swagger
 * /api/materials/statistics:
 *   get:
 *     summary: Get learning material statistics for staff roles
 *     tags: [Learning Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated learning material statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   materialId:
 *                     type: string
 *                     example: material-advanced
 *                   completionsCount:
 *                     type: integer
 *                     example: 42
 *                   averageRating:
 *                     type: number
 *                     example: 4.5
 *       403:
 *         description: Access denied
 */
router.get(
    '/statistics',
    authenticateToken,
    requireRole([Role.SYSTEM_ADMIN, Role.MENTOR, Role.COMPANY_ADMIN]),
    materialController.getStatistics
);

export default router;
