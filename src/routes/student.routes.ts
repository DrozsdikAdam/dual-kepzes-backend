import { Router } from "express"
import { authenticateToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    getAllStudents,
    getMyProfile,
    updateMyProfile,
    updateStudentById,
    getStudentById,
    deleteMyProfile,
    deleteStudentById
} from "../controllers/student.controller";
import { MyProfileUpdateSchema, StudentUpdateSchema } from "../schemas/student.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student profile management
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: List all students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 */
router.get("/", authenticateToken, getAllStudents);

/**
 * @swagger
 * /api/students/me:
 *   get:
 *     summary: Get my own student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My profile details
 */
router.get("/me", authenticateToken, getMyProfile);

/**
 * @swagger
 * /api/students/me:
 *   patch:
 *     summary: Update my own student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudent'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", authenticateToken, validate(MyProfileUpdateSchema), updateMyProfile);

/**
 * @swagger
 * /api/students/me:
 *   delete:
 *     summary: Delete my own account
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete("/me", authenticateToken, deleteMyProfile)

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student profile by ID
 *     tags: [Students]
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
 *         description: Student profile details
 */
router.get("/:id", authenticateToken, getStudentById)

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete a student profile by ID (Admin)
 *     tags: [Students]
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
 *         description: Student profile deleted successfully
 */
router.delete("/:id", authenticateToken, deleteStudentById)

/**
 * @swagger
 * /api/students/{id}:
 *   patch:
 *     summary: Update a student profile by ID (Admin)
 *     tags: [Students]
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
 *             $ref: '#/components/schemas/UpdateStudent'
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 */
router.patch("/:id", authenticateToken, validate(StudentUpdateSchema), updateStudentById);

export default router;