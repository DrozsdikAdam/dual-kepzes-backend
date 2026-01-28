import { Router } from "express";
import {
    createPosition,
    deletePosition,
    getAllPositions,
    getDualPositions,
    getNonDualPositions,
    getPositionById,
    updatePosition,
    deactivatePosition,
    getPositionsByCompanyId
} from "../controllers/jobController";
import { validate } from "../middlewares/validateMiddleware";
import {
    PositionCreateSchema,
    PositionUpdateSchema,
} from "../schemas/jobSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job position management
 */

// Pozíció végpontok

/**
 * @swagger
 * /api/jobs/positions:
 *   get:
 *     summary: List all job positions
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of all positions
 */
router.get("/positions",
    getAllPositions
);

/**
 * @swagger
 * /api/jobs/positions/dual:
 *   get:
 *     summary: List dual education positions only
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of dual positions
 */
router.get("/positions/dual",
    getDualPositions
);

/**
 * @swagger
 * /api/jobs/positions/non-dual:
 *   get:
 *     summary: List non-dual job positions
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of non-dual positions
 */
router.get("/positions/non-dual",
    getNonDualPositions
);

/**
 * @swagger
 * /api/jobs/positions/{id}:
 *   get:
 *     summary: Get position details by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position details
 */
router.get("/positions/:id",
    getPositionById
);

/**
 * @swagger
 * /api/jobs/positions/company/{companyId}:
 *   get:
 *     summary: List positions for a specific company
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of positions for the company
 */
router.get("/positions/company/:companyId",
    getPositionsByCompanyId
);

/**
 * @swagger
 * /api/jobs/positions:
 *   post:
 *     summary: Create a new job position
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePosition'
 *     responses:
 *       201:
 *         description: Position created successfully
 */
router.post(
    "/positions",
    authenticateToken,
    validate(PositionCreateSchema),
    createPosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}:
 *   patch:
 *     summary: Update an existing position
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePosition'
 *     responses:
 *       200:
 *         description: Position updated successfully
 */
router.patch(
    "/positions/:id",
    authenticateToken,
    validate(PositionUpdateSchema),
    updatePosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}:
 *   delete:
 *     summary: Delete a position permanently
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position deleted successfully
 */
router.delete("/positions/:id",
    authenticateToken,
    deletePosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a position (logical delete)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position deactivated successfully
 */
router.patch("/positions/:id/deactivate",
    authenticateToken,
    deactivatePosition
);

export default router;
