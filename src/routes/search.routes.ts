import { Router } from "express";
import { globalSearch } from "../controllers/search.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global search across entities
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search across positions, companies and news
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query string (minimum 2 characters)
 *     responses:
 *       200:
 *         description: Search results containing positions, companies, and news
 */
router.get("/", globalSearch);

export default router;
