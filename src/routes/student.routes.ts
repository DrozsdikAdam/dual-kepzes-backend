import { Router } from "express"
import { authenticateToken, isStudent, isStaff, isUniversityStaff, isSystemAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    getAllStudents,
    getMyProfile,
    updateMyProfile,
    updateStudentById,
    getStudentById,
    deleteMyProfile,
    deleteStudentById,
    transitionToUniversity,
    getAvailableStudents,
    toggleAvailableForWork,
    expressInterest
} from "../controllers/student.controller";
import { MyProfileUpdateSchema, StudentUpdateSchema, UniversityTransitionSchema, ExpressInterestSchema } from "../schemas/student.schema";

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
router.get("/", authenticateToken, isUniversityStaff, getAllStudents);

/**
 * @swagger
 * /api/students/available:
 *   get:
 *     summary: List all students available for work (Public information only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available students with non-sensitive data
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
 *                     $ref: '#/components/schemas/PublicStudent'
 */
router.get("/available", authenticateToken, isStaff, getAvailableStudents);

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
router.get("/me", authenticateToken, isStudent, getMyProfile);

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
router.patch("/me", authenticateToken, isStudent, validate(MyProfileUpdateSchema), updateMyProfile);

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
router.delete("/me", authenticateToken, isStudent, deleteMyProfile)

/**
 * @swagger
 * /api/students/me/university-transition:
 *   patch:
 *     summary: Transition from high school profile to university profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - neptunCode
 *               - majorId
 *             properties:
 *               neptunCode:
 *                 type: string
 *               majorId:
 *                 type: string
 *                 format: uuid
 *               graduationYear:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transitioned to university profile successfully
 */
router.patch("/me/university-transition", authenticateToken, isStudent, validate(UniversityTransitionSchema), transitionToUniversity);

/**
 * @swagger
 * /api/students/me/toggle-availability:
 *   patch:
 *     summary: Toggle available for work status
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability status toggled successfully
 */
router.patch("/me/toggle-availability", authenticateToken, isStudent, toggleAvailableForWork);

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
router.get("/:id", authenticateToken, isStaff, getStudentById)

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
router.delete("/:id", authenticateToken, isSystemAdmin, deleteStudentById)

router.patch("/:id", authenticateToken, isSystemAdmin, validate(StudentUpdateSchema), updateStudentById);

/**
 * @swagger
 * /api/students/{id}/interest:
 *   post:
 *     summary: Express interest in a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Interest expressed successfully
 */
router.post("/:id/interest", authenticateToken, isStaff, validate(ExpressInterestSchema), expressInterest);

export default router;