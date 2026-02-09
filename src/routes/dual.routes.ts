
import { Router } from "express";
import {
    deletePartnership,
    getPartnershipById,
    updatePartnership,
    terminatePartnership,
    completePartnership,
    assignMentor,
    assignUniversityUser,
    getStudentPartnerships,
    getCompanyPartnerships,
    getUniversityPartnerships
} from "../controllers/dual.controller";
import { validate } from "../middlewares/validate.middleware";
import {
    AssignMentorSchema,
    AssignUniversityUserSchema,
    DualPartnershipUpdateSchema,
} from "../schemas/dual.schema";
import {
    authenticateToken,
    isCompanyEmployee,
    isStudent,
    isUniversityStaff
} from "../middlewares/auth.middleware";
import { requirePartnershipOwnership } from "../middlewares/ownership.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Partnerships
 *   description: Dual partnership management
 */

/**
 * @swagger
 * /api/partnerships/student:
 *   get:
 *     summary: Get student's dual partnerships
 *     tags: [Partnerships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student partnerships
 *       401:
 *         description: Unauthorized
 */
router.get("/student",
    authenticateToken,
    getStudentPartnerships
);

/**
 * @swagger
 * /api/partnerships/company:
 *   get:
 *     summary: Get company's dual partnerships
 *     tags: [Partnerships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company partnerships
 *       401:
 *         description: Unauthorized
 */
router.get("/company",
    authenticateToken,
    getCompanyPartnerships
);

/**
 * @swagger
 * /api/partnerships/university:
 *   get:
 *     summary: Get all dual partnerships for university
 *     tags: [Partnerships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all partnerships
 *       401:
 *         description: Unauthorized
 */
router.get("/university",
    authenticateToken,
    getUniversityPartnerships
);

/**
 * @swagger
 * /api/partnerships/{id}:
 *   get:
 *     summary: Get partnership by ID
 *     tags: [Partnerships]
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
 *         description: Partnership details
 *       404:
 *         description: Partnership not found
 */
router.get("/:id",
    authenticateToken,
    getPartnershipById
);

/**
 * @swagger
 * /api/partnerships/{id}:
 *   patch:
 *     summary: Update partnership data
 *     tags: [Partnerships]
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
 *             type: object
 *             properties:
 *               semester:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Partnership updated successfully
 */
router.patch(
    "/:id",
    authenticateToken,
    requirePartnershipOwnership,
    validate(DualPartnershipUpdateSchema),
    updatePartnership
);

/**
 * @swagger
 * /api/partnerships/{id}/assign-mentor:
 *   patch:
 *     summary: Assign a mentor to a partnership
 *     tags: [Partnerships]
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
 *             type: object
 *             required:
 *               - mentorId
 *             properties:
 *               mentorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mentor assigned successfully
 */
router.patch(
    "/:id/assign-mentor",
    authenticateToken,
    validate(AssignMentorSchema),
    assignMentor
);

/**
 * @swagger
 * /api/partnerships/{id}/assign-university-user:
 *   patch:
 *     summary: Assign a university user to a partnership
 *     tags: [Partnerships]
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
 *             type: object
 *             required:
 *               - uniEmployeeId
 *             properties:
 *               uniEmployeeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: University user assigned successfully
 */
router.patch(
    "/:id/assign-university-user",
    authenticateToken,
    validate(AssignUniversityUserSchema),
    assignUniversityUser
);

/**
 * @swagger
 * /api/partnerships/{id}/terminate:
 *   patch:
 *     summary: Terminate a partnership
 *     tags: [Partnerships]
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
 *         description: Partnership terminated successfully
 */
router.patch(
    "/:id/terminate",
    authenticateToken,
    requirePartnershipOwnership,
    terminatePartnership
);

/**
 * @swagger
 * /api/partnerships/{id}/complete:
 *   patch:
 *     summary: Complete a partnership
 *     tags: [Partnerships]
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
 *         description: Partnership completed successfully
 */
router.patch(
    "/:id/complete",
    authenticateToken,
    requirePartnershipOwnership,
    completePartnership
);

/**
 * @swagger
 * /api/partnerships/{id}:
 *   delete:
 *     summary: Delete a partnership
 *     tags: [Partnerships]
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
 *         description: Partnership deleted successfully
 */
router.delete("/:id",
    authenticateToken,
    requirePartnershipOwnership,
    deletePartnership
);

export default router;
