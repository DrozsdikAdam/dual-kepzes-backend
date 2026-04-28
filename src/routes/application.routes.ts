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
     updateEvaluation,
     submitApplicationFiles
} from "../controllers/application.controller";
import { authenticateToken, isCompanyEmployee, isStudent, isSystemAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateApplicationSchema, EvaluateApplicationSchema, UpdateApplicationSchema } from "../schemas/application.schema";
import { uploadConfig } from "../config/upload.config";
import { requireIdempotency } from "../middlewares/idempotency.middleware";

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
router.post("/", isStudent, requireIdempotency(), validate(CreateApplicationSchema), applyToPosition)

/**
 * @swagger
 * /api/applications/submit-with-files:
 *   post:
 *     summary: Submit application with CV and motivation letter files
 *     description: |
 *       GDPR-kompatibilis végpont - a fájlok csak memóriában tárolódnak,
 *       azonnal továbbítódnak emailben a HR-nek, majd törlődnek.
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - positionId
 *               - cv
 *             properties:
 *               positionId:
 *                 type: string
 *                 format: uuid
 *                 description: A pozíció azonosítója
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: Önéletrajz (PDF vagy Word, max 25MB)
 *               motivationLetter:
 *                 type: string
 *                 format: binary
 *                 description: Motivációs levél (PDF vagy Word, max 25MB, opcionális)
 *     responses:
 *       201:
 *         description: Jelentkezés sikeresen beküldve, dokumentumok továbbítva
 *       400:
 *         description: Hiányzó vagy érvénytelen fájlok
 *       403:
 *         description: Csak hallgatói profillal lehet jelentkezni
 *       404:
 *         description: Pozíció nem található
 */
router.post(
     "/submit-with-files",
     isStudent,
     requireIdempotency(),
     uploadConfig.fields([
          { name: "cv", maxCount: 1 },
          { name: "motivationLetter", maxCount: 1 }
     ]),
     submitApplicationFiles
)

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
 *         description: List of own applications with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     submitted:
 *                       type: integer
 *                       description: Number of submitted applications
 *                     accepted:
 *                       type: integer
 *                       description: Number of accepted applications
 */
router.get("/", isStudent, getMyApplications)

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
router.patch("/:id/retract", isStudent, retractApplication)

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
router.get("/company", isCompanyEmployee, getMyCompanyApplications)

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
 *       400:
 *         description: A hallgatónak már van aktív vagy folyamatban lévő duális kapcsolata.
 */
router.patch("/company/:id/evaluate", isCompanyEmployee, validate(EvaluateApplicationSchema), evaluateApplication)

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
 *       400:
 *         description: Invalid status transition or invalid payload
 */
router.patch("/company/:id", isCompanyEmployee, validate(UpdateApplicationSchema), updateEvaluation)

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
router.get("/admin", isSystemAdmin, getApplications)

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
router.get("/admin/:id", isSystemAdmin, getApplication)

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
router.patch("/admin/:id", isSystemAdmin, validate(UpdateApplicationSchema), updateApplication)

export default router;
