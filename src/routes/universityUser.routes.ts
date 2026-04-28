import { Router } from "express";
import { authenticateToken, isUniversityUser, isUniversityStaff, isSystemAdmin } from "../middlewares/auth.middleware";
import {
     getUniversityUserById,
     getUniversityUsers,
     updateUniversityUserById,
     deleteUniversityUser,
     getMeUniversityUser,
     updateMeUniversityUser,
     deleteMeUniversityUser,
     getMyAssignments,
     assignMajorsToReferent,
     assignCompaniesToReferent,
     listAllReferents,
     getPotentialReferents
} from "../controllers/universityUser.controller";
import { validate } from "../middlewares/validate.middleware";
import { 
     UniversityUserUpdateSchema, 
     AssignMajorsSchema, 
     AssignCompaniesSchema,
     PotentialReferentsQuerySchema
} from "../schemas/universityUser.schema";

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
router.get("/me", isUniversityUser, getMeUniversityUser);

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
router.patch("/me", isUniversityUser, validate(UniversityUserUpdateSchema), updateMeUniversityUser);

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
router.delete("/me", isUniversityUser, deleteMeUniversityUser);

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
router.get("/", isUniversityStaff, getUniversityUsers);

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
router.get("/:id", isUniversityStaff, getUniversityUserById)

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
router.patch("/:id", isSystemAdmin, validate(UniversityUserUpdateSchema), updateUniversityUserById)

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
router.delete("/:id", isSystemAdmin, deleteUniversityUser)

// --- Referensi hozzárendelések ---

/**
 * @swagger
 * /api/university-users/me/assignments:
 *   get:
 *     summary: Get my assigned majors and companies (Referent)
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me/assignments", isUniversityUser, getMyAssignments);

/**
 * @swagger
 * /api/university-users/referents:
 *   get:
 *     summary: List all active referents
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 */
router.get("/referents", isUniversityStaff, listAllReferents);

/**
 * @swagger
 * /api/university-users/potential-referents:
 *   get:
 *     summary: List potential referents for a partnership (Staff/Admin)
 *     tags: [UniversityUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.get("/potential-referents", isUniversityStaff, validate(PotentialReferentsQuerySchema), getPotentialReferents);

/**
 * @swagger
 * /api/university-users/{id}/majors:
 *   post:
 *     summary: Assign majors to a referent (Admin)
 *     tags: [UniversityUsers]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [majorIds]
 *             properties:
 *               majorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 */
router.post("/:id/majors", isSystemAdmin, validate(AssignMajorsSchema), assignMajorsToReferent);

/**
 * @swagger
 * /api/university-users/{id}/companies:
 *   post:
 *     summary: Assign companies to a referent (Admin)
 *     tags: [UniversityUsers]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyIds]
 *             properties:
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 */
router.post("/:id/companies", isSystemAdmin, validate(AssignCompaniesSchema), assignCompaniesToReferent);

export default router;
