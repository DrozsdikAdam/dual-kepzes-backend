import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
     getUniversityUserById,
     getUniversityUsers,
     updateUniversityUserById,
     deleteUniversityUser,
     getMeUniversityUser,
     updateMeUniversityUser,
     deleteMeUniversityUser
} from "../controllers/universityUser.controller";
import { validate } from "../middlewares/validate.middleware";
import { UniversityUserUpdateSchema } from "../schemas/universityUser.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: UniversityUsers
 *   description: University staff account management
 */

router.use(authenticateToken)

/**
 * @swagger
 * /api/university-users/me:
 *   get:
 *     summary: Get my own university user profile
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My university user profile details
 */
router.get("/me", getMeUniversityUser);

/**
 * @swagger
 * /api/university-users/me:
 *   patch:
 *     summary: Update my own university user profile
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserBody'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", validate(UniversityUserUpdateSchema), updateMeUniversityUser);

/**
 * @swagger
 * /api/university-users/me:
 *   delete:
 *     summary: Delete my own university user account
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete("/me", deleteMeUniversityUser);

/**
 * @swagger
 * /api/university-users:
 *   get:
 *     summary: List all university users (Admin)
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of university users
 */
router.get("/", getUniversityUsers);

/**
 * @swagger
 * /api/university-users/{id}:
 *   get:
 *     summary: Get university user details by ID (Admin)
 *     tags: [UniversityUsers]
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
 *         description: University user details
 */
router.get("/:id", getUniversityUserById)

/**
 * @swagger
 * /api/university-users/{id}:
 *   patch:
 *     summary: Update a university user by ID (Admin)
 *     tags: [UniversityUsers]
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
 *             $ref: '#/components/schemas/UpdateUserBody'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/:id", validate(UniversityUserUpdateSchema), updateUniversityUserById)

/**
 * @swagger
 * /api/university-users/{id}:
 *   delete:
 *     summary: Delete a university user by ID (Admin)
 *     tags: [UniversityUsers]
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
 *         description: Account deleted successfully
 */
router.delete("/:id", deleteUniversityUser)

export default router;