import { Router } from "express";
import { authenticateToken, isSystemAdmin } from "../middlewares/auth.middleware";
import { getInactiveUsers, reactivateUser, deactivateUser } from "../controllers/user.controller";

const router = Router();

// Minden routehoz szükséges a bejelentkezés, de SystemAdmin jog nem (egyelőre)
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management
 */

// Minden routehoz szükséges a bejelentkezés, de SystemAdmin jog nem (egyelőre)
router.use(authenticateToken);
router.use(isSystemAdmin);

/**
 * @swagger
 * /api/users/inactive:
 *   get:
 *     summary: List inactive users (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inactive users
 */
router.get("/inactive", getInactiveUsers);

/**
 * @swagger
 * /api/users/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a deactivated user (Admin)
 *     tags: [Users]
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
 *         description: User reactivated successfully
 */
router.patch("/:id/reactivate", reactivateUser);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user account (logical delete) (Admin)
 *     tags: [Users]
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
 *         description: User deactivated successfully
 */
router.patch("/:id/deactivate", deactivateUser);

export default router;
