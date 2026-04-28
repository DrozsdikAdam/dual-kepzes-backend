import { Router } from "express"
import { validate } from "../middlewares/validate.middleware"
import {
     getSystemAdminById,
     getSystemAdmins,
     updateSystemAdminById,
     deleteSystemAdmin,
     getMeSystemAdmin,
     updateMeSystemAdmin,
     deleteMeSystemAdmin,
     getAllAdminUsers,
     inviteCompany,
     inviteStudent
} from "../controllers/systemAdmin.controller"
import { SystemAdminUpdateSchema, InviteEmailSchema } from "../schemas/systemAdmin.schema"
import { authenticateToken, isSystemAdmin } from "../middlewares/auth.middleware"

const router = Router()

/**
 * @swagger
 * tags:
 *   name: SystemAdmins
 *   description: System administrator account management
 */

router.use(authenticateToken)
router.use(isSystemAdmin)

/**
 * @swagger
 * /api/system-admins/invite-company:
 *   post:
 *     summary: Send a registration invitation email to a company
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, subject, body]
 *             properties:
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post("/invite-company", validate(InviteEmailSchema), inviteCompany)

/**
 * @swagger
 * /api/system-admins/invite-student:
 *   post:
 *     summary: Send a registration invitation email to a student
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, subject, body]
 *             properties:
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post("/invite-student", validate(InviteEmailSchema), inviteStudent)

/**
 * @swagger
 * /api/system-admins/me:
 *   get:
 *     summary: Get my own system admin profile
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My system admin profile details
 */
router.get("/me", getMeSystemAdmin)

/**
 * @swagger
 * /api/system-admins/me:
 *   patch:
 *     summary: Update my own system admin profile
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", validate(SystemAdminUpdateSchema), updateMeSystemAdmin)

/**
 * @swagger
 * /api/system-admins/me:
 *   delete:
 *     summary: Delete my own system admin account
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete("/me", deleteMeSystemAdmin)

/**
 * @swagger
 * /api/system-admins/admin-users:
 *   get:
 *     summary: List all users with any admin role (Admin)
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 */
router.get("/admin-users", getAllAdminUsers)

/**
 * @swagger
 * /api/system-admins:
 *   get:
 *     summary: List all system admins (Admin)
 *     tags: [SystemAdmins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of system admins
 */
router.get("/", getSystemAdmins)

/**
 * @swagger
 * /api/system-admins/{id}:
 *   get:
 *     summary: Get system admin details by ID (Admin)
 *     tags: [SystemAdmins]
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
 *         description: System admin details
 */
router.get("/:id", getSystemAdminById)

/**
 * @swagger
 * /api/system-admins/{id}:
 *   patch:
 *     summary: Update a system admin by ID (Admin)
 *     tags: [SystemAdmins]
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
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/:id", validate(SystemAdminUpdateSchema), updateSystemAdminById)

/**
 * @swagger
 * /api/system-admins/{id}:
 *   delete:
 *     summary: Delete a system admin by ID (Admin)
 *     tags: [SystemAdmins]
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
router.delete("/:id", deleteSystemAdmin)

export default router
