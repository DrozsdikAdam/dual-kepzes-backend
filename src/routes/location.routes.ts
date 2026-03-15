import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getAllLocations } from "../controllers/location.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location management
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: List all company locations with address, company info, and position count
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       country:
 *                         type: string
 *                       zipCode:
 *                         type: string
 *                       city:
 *                         type: string
 *                       address:
 *                         type: string
 *                       company:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       positionCount:
 *                         type: integer
 */
router.get("/", getAllLocations);

export default router;
