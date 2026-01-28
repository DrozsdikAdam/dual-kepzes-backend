import { Router } from "express";
import {
     applyToPosition,
     evaluateApplication,
     getApplication,
     getApplications,
     getMyApplications,
     getMyCompanyApplications,
     retractApplication,
     updateApplication,
     updateEvaluation
} from "../controllers/applicationController";
import { authenticateToken, isCompanyEmployee, isStudent, isSystemAdmin } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { CreateApplicationSchema, EvaluateApplicationSchema, UpdateApplicationSchema } from "../schemas/applicationSchema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application management
 */

router.use(authenticateToken)

// Student routes

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Apply to a dual position
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApplication'
 *     responses:
 *       201:
 *         description: Application submitted successfully
 */
router.post("/", validate(CreateApplicationSchema), applyToPosition)

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get my job applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of own applications
 */
router.get("/", getMyApplications)

/**
 * @swagger
 * /api/applications/{id}/retract:
 *   patch:
 *     summary: Retract an application
 *     tags: [Applications]
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
 *         description: Application retracted successfully
 */
router.patch("/:id/retract", retractApplication)

// Company routes

/**
 * @swagger
 * /api/applications/company:
 *   get:
 *     summary: Get applications to my company
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications for the company
 */
router.get("/company", getMyCompanyApplications)

/**
 * @swagger
 * /api/applications/company/{id}/evaluate:
 *   patch:
 *     summary: Evaluate a student's application
 *     tags: [Applications]
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
 *             $ref: '#/components/schemas/EvaluateApplication'
 *     responses:
 *       200:
 *         description: Application evaluated successfully
 */
router.patch("/company/:id/evaluate", validate(EvaluateApplicationSchema), evaluateApplication)

/**
 * @swagger
 * /api/applications/company/{id}:
 *   patch:
 *     summary: Update an evaluation
 *     tags: [Applications]
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
 *             $ref: '#/components/schemas/UpdateEvaluation'
 *     responses:
 *       200:
 *         description: Evaluation updated successfully
 */
router.patch("/company/:id", validate(UpdateApplicationSchema), updateEvaluation)

// System Admin routes

/**
 * @swagger
 * /api/applications/admin:
 *   get:
 *     summary: List all applications (Admin)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all applications
 */
router.get("/admin", getApplications)

/**
 * @swagger
 * /api/applications/admin/{id}:
 *   get:
 *     summary: Get application details (Admin)
 *     tags: [Applications]
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
 *         description: Application details
 */
router.get("/admin/:id", getApplication)

/**
 * @swagger
 * /api/applications/admin/{id}:
 *   patch:
 *     summary: Update an application (Admin)
 *     tags: [Applications]
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
 *             $ref: '#/components/schemas/UpdateEvaluation'
 *     responses:
 *       200:
 *         description: Application updated successfully
 */
router.patch("/admin/:id", validate(UpdateApplicationSchema), updateApplication)

export default router;