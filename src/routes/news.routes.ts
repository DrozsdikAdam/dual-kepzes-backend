import { Router } from "express";
import {
     archiveNews,
     createNews,
     deleteNews,
     getAdminNews,
     getAdminNewsById,
     getArchivedNews,
     getAllNews,
     getUserNewsById,
     unarchiveNews,
     updateNews,
} from "../controllers/news.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateNewsSchema, UpdateNewsSchema } from "../schemas/news.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News and announcement management
 */

router.use(authenticateToken);

// Admin routes

/**
 * @swagger
 * /api/news/admin:
 *   post:
 *     summary: Create a new announcement (Admin)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNews'
 *     responses:
 *       201:
 *         description: News created successfully
 */
router.post("/admin", validate(CreateNewsSchema), createNews);

/**
 * @swagger
 * /api/news/admin:
 *   get:
 *     summary: Get all news including archived (Admin)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all news
 */
router.get("/admin", getAdminNews);

/**
 * @swagger
 * /api/news/admin/archived:
 *   get:
 *     summary: Get archived news only (Admin)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived news
 */
router.get("/admin/archived", getArchivedNews);

/**
 * @swagger
 * /api/news/admin/{id}:
 *   get:
 *     summary: Get news by ID (Admin)
 *     tags: [News]
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
 *         description: News details
 */
router.get("/admin/:id", getAdminNewsById);

/**
 * @swagger
 * /api/news/admin/{id}:
 *   patch:
 *     summary: Update news (Admin)
 *     tags: [News]
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
 *             $ref: '#/components/schemas/UpdateNews'
 *     responses:
 *       200:
 *         description: News updated successfully
 */
router.patch("/admin/:id", validate(UpdateNewsSchema), updateNews);

/**
 * @swagger
 * /api/news/admin/{id}/archive:
 *   patch:
 *     summary: Archive news (Admin)
 *     tags: [News]
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
 *         description: News archived successfully
 */
router.patch("/admin/:id/archive", archiveNews);

/**
 * @swagger
 * /api/news/admin/{id}/unarchive:
 *   patch:
 *     summary: Unarchive news (Admin)
 *     tags: [News]
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
 *         description: News unarchived successfully
 */
router.patch("/admin/:id/unarchive", unarchiveNews);

/**
 * @swagger
 * /api/news/admin/{id}:
 *   delete:
 *     summary: Delete news permanently (Admin)
 *     tags: [News]
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
 *         description: News deleted successfully
 */
router.delete("/admin/:id", deleteNews);

// User routes

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all active news for the current user
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of news
 */
router.get("/", getAllNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get news details by ID
 *     tags: [News]
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
 *         description: News details
 */
router.get("/:id", getUserNewsById);

export default router;