import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
     getSystemStats,
     getApplicationStats,
     getPartnershipStats,
     getPositionStats,
     getTrendStats
} from "../controllers/statsController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: System-wide statistics and reporting
 */

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get overall system statistics (Admin)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Object containing system stats
 */
router.get("/", authenticateToken, getSystemStats);

/**
 * @swagger
 * /api/stats/applications:
 *   get:
 *     summary: Get application statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application statistics including status breakdown, conversion rate, average per position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     conversionRate:
 *                       type: number
 *                       description: Acceptance rate in percentage
 *                     averagePerPosition:
 *                       type: number
 *                       description: Average applications per position
 *                     lastMonthCount:
 *                       type: integer
 *                       description: Applications in the last 30 days
 */
router.get("/applications", authenticateToken, getApplicationStats);

/**
 * @swagger
 * /api/stats/partnerships:
 *   get:
 *     summary: Get partnership statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partnership statistics including status breakdown, semester breakdown, average duration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     bySemester:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           semester:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     averageDurationDays:
 *                       type: integer
 *                       description: Average partnership duration in days
 */
router.get("/partnerships", authenticateToken, getPartnershipStats);

/**
 * @swagger
 * /api/stats/positions:
 *   get:
 *     summary: Get position statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Position statistics including expiring positions, positions without applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     expiringIn7Days:
 *                       type: integer
 *                       description: Positions expiring in the next 7 days
 *                     withNoApplications:
 *                       type: integer
 *                       description: Active positions with no applications
 */
router.get("/positions", authenticateToken, getPositionStats);

/**
 * @swagger
 * /api/stats/trends:
 *   get:
 *     summary: Get trend statistics for the last 6 months
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends for registrations, applications, and partnerships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     registrationsPerMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "2026-01"
 *                           count:
 *                             type: integer
 *                     applicationsPerMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     partnershipsPerMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get("/trends", authenticateToken, getTrendStats);

export default router;