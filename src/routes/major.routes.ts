import { Router } from "express";
import {
     createMajor,
     getAllMajors,
     getMajorById,
     updateMajor,
     deleteMajor
} from "../controllers/major.controller";
import { authenticateToken, isSystemAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateMajorSchema, UpdateMajorSchema, MajorIdParamSchema } from "../schemas/major.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Majors
 *   description: Major (szak) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Major:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         language:
 *           type: string
 *     CreateMajor:
 *       type: object
 *       required:
 *         - name
 *         - language
 *       properties:
 *         name:
 *           type: string
 *           description: A szak neve
 *         language:
 *           type: string
 *           description: A képzés nyelve
 *     UpdateMajor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         language:
 *           type: string
 */

/**
 * @swagger
 * /api/majors:
 *   get:
 *     summary: Get all majors
 *     tags: [Majors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of majors
 */
router.get("/", getAllMajors);

/**
 * @swagger
 * /api/majors/{id}:
 *   get:
 *     summary: Get major by ID
 *     tags: [Majors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Major details
 *       404:
 *         description: Major not found
 */
router.get("/:id", validate(MajorIdParamSchema), getMajorById);

// Protected routes - require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/majors:
 *   post:
 *     summary: Create a new major (Admin only)
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMajor'
 *     responses:
 *       201:
 *         description: Major created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", isSystemAdmin, validate(CreateMajorSchema), createMajor);

/**
 * @swagger
 * /api/majors/{id}:
 *   patch:
 *     summary: Update major (Admin only)
 *     tags: [Majors]
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
 *             $ref: '#/components/schemas/UpdateMajor'
 *     responses:
 *       200:
 *         description: Major updated successfully
 *       404:
 *         description: Major not found
 */
router.patch("/:id", isSystemAdmin, validate(UpdateMajorSchema), updateMajor);

/**
 * @swagger
 * /api/majors/{id}:
 *   delete:
 *     summary: Delete major (Admin only)
 *     tags: [Majors]
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
 *         description: Major deleted successfully
 *       404:
 *         description: Major not found
 */
router.delete("/:id", isSystemAdmin, validate(MajorIdParamSchema), deleteMajor);

export default router;
