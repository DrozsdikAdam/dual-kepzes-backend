import { Router } from "express"
import { validate } from "../middlewares/validate.middleware"
import {
     getCompanyAdminById,
     getCompanyAdmins,
     updateCompanyAdminById,
     deleteCompanyAdmin,
     getMeCompanyAdmin,
     updateMeCompanyAdmin,
     deleteMeCompanyAdmin,
     restoreCompanyAdmin
} from "../controllers/companyAdmin.controller"
import { CompanyAdminUpdateSchema } from "../schemas/companyAdmin.schema"
import { authenticateToken } from "../middlewares/auth.middleware"

const router = Router()

/**
 * @swagger
 * tags:
 *   name: CompanyAdmins
 *   description: Company administrator account management
 */

router.use(authenticateToken)

/**
 * @swagger
 * /api/company-admins/me:
 *   get:
 *     summary: Get my own company admin profile
 *     tags: [CompanyAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My company admin profile details
 */
router.get("/me", getMeCompanyAdmin)

/**
 * @swagger
 * /api/company-admins/me:
 *   patch:
 *     summary: Update my own company admin profile
 *     tags: [CompanyAdmins]
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
router.patch("/me", validate(CompanyAdminUpdateSchema), updateMeCompanyAdmin)

/**
 * @swagger
 * /api/company-admins/me:
 *   delete:
 *     summary: Delete my own company admin account
 *     tags: [CompanyAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete("/me", deleteMeCompanyAdmin)

/**
 * @swagger
 * /api/company-admins:
 *   get:
 *     summary: List all company admins (Admin)
 *     tags: [CompanyAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all company admins
 */
router.get("/", getCompanyAdmins)

/**
 * @swagger
 * /api/company-admins/restore/{id}:
 *   patch:
 *     summary: Restore a deleted company admin (Admin)
 *     tags: [CompanyAdmins]
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
 *         description: Account restored successfully
 */
router.patch("/restore/:id", restoreCompanyAdmin)

/**
 * @swagger
 * /api/company-admins/{id}:
 *   get:
 *     summary: Get company admin details by ID (Admin)
 *     tags: [CompanyAdmins]
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
 *         description: Company admin details
 */
router.get("/:id", getCompanyAdminById)

/**
 * @swagger
 * /api/company-admins/{id}:
 *   patch:
 *     summary: Update a company admin by ID (Admin)
 *     tags: [CompanyAdmins]
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
router.patch("/:id", validate(CompanyAdminUpdateSchema), updateCompanyAdminById)

/**
 * @swagger
 * /api/company-admins/{id}:
 *   delete:
 *     summary: Delete a company admin by ID (Admin)
 *     tags: [CompanyAdmins]
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
router.delete("/:id", deleteCompanyAdmin)

export default router
