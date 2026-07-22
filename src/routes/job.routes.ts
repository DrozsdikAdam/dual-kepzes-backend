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
} from "../controllers/job.controller";
import { validate } from "../middlewares/validate.middleware";
import {
    PositionCreateSchema,
    PositionUpdateSchema,
} from "../schemas/job.schema";
import { authenticateToken, isCompanyAdmin, isCompanyEmployee, requireRole } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { requirePositionOwnership } from "../middlewares/ownership.middleware";
import { requireIdempotency } from "../middlewares/idempotency.middleware";

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
 *           format: uuid
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
 *           format: uuid
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
 *     summary: Create a new job position (Company Admin)
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
    isCompanyAdmin,
    requireIdempotency(),
    validate(PositionCreateSchema),
    createPosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}:
 *   patch:
 *     summary: Update an existing position (Company Employee + Owner)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
    isCompanyEmployee,
    requirePositionOwnership,
    validate(PositionUpdateSchema),
    updatePosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}:
 *   delete:
 *     summary: Delete a position (Company Employee + Owner)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Position deleted successfully
 */
router.delete("/positions/:id",
    authenticateToken,
    requireRole([Role.SYSTEM_ADMIN, Role.COMPANY_ADMIN, Role.MENTOR]),
    requirePositionOwnership,
    deletePosition
);

/**
 * @swagger
 * /api/jobs/positions/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a position (Company Employee + Owner)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Position deactivated successfully
 */
router.patch("/positions/:id/deactivate",
    authenticateToken,
    isCompanyEmployee,
    requirePositionOwnership,
    deactivatePosition
);

export default router;
