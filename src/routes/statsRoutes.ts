import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { getSystemStats } from "../controllers/statsController";

const router = Router();

// Csak bejelentkezett felhasználók láthatják
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

export default router;