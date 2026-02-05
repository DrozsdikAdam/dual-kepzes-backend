import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
     getInactiveCompanies,
     reactivateCompany,
     deactivateCompany,
     getAllCompanies,
     getCompanyById,
     createCompany,
     createCompanyWithAdmin,
     updateCompany,
     deleteCompany,
     getOwnApplicationCompanies
} from "../controllers/company.controller";
import { validate } from "../middlewares/validate.middleware";
import { CompanyCreateSchema, CompanyUpdateSchema } from "../schemas/job.schema";
import { CompanyWithAdminCreateSchema } from "../schemas/company.schema";

const router = Router();

// Minden routehoz szükséges a bejelentkezés
/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management and profiles
 */

// Minden routehoz szükséges a bejelentkezés
router.use(authenticateToken);

// Specifikus route-ok (id előtt kell lenniük)

/**
 * @swagger
 * /api/companies/inactive:
 *   get:
 *     summary: List inactive companies (Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inactive companies
 */
router.get("/inactive", getInactiveCompanies);

/**
 * @swagger
 * /api/companies/own-application:
 *   get:
 *     summary: List companies that have their own application platform
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies with own application platform
 */
router.get("/own-application", getOwnApplicationCompanies);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List all active companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active companies
 */
router.get("/", getAllCompanies);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company (Admin/Internal)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompany'
 *     responses:
 *       201:
 *         description: Company created successfully
 */
router.post(
     "/",
     validate(CompanyCreateSchema),
     createCompany
);

/**
 * @swagger
 * /api/companies/with-admin:
 *   post:
 *     summary: Create a new company and its admin user in one request (Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company, admin]
 *             properties:
 *               company:
 *                 $ref: '#/components/schemas/CreateCompany'
 *               admin:
 *                 type: object
 *                 required: [email, password, fullName, phoneNumber]
 *                 properties:
 *                   email: { type: string }
 *                   password: { type: string }
 *                   fullName: { type: string }
 *                   phoneNumber: { type: string }
 *                   jobTitle: { type: string }
 *     responses:
 *       201:
 *         description: Company and admin created successfully
 */
router.post(
     "/with-admin",
     validate(CompanyWithAdminCreateSchema),
     createCompanyWithAdmin
);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company details by ID
 *     tags: [Companies]
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
 *         description: Company details
 */
router.get("/:id", getCompanyById);

// Általános cég frissítés

/**
 * @swagger
 * /api/companies/{id}:
 *   patch:
 *     summary: Update company details
 *     tags: [Companies]
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
 *             $ref: '#/components/schemas/UpdateCompany'
 *     responses:
 *       200:
 *         description: Company updated successfully
 */
router.patch(
     "/:id",
     validate(CompanyUpdateSchema),
     updateCompany
);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete a company permanently (Admin)
 *     tags: [Companies]
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
 *         description: Company deleted successfully
 */
router.delete("/:id", deleteCompany);

// Egyéb műveletek id alapján

/**
 * @swagger
 * /api/companies/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a deactivated company (Admin)
 *     tags: [Companies]
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
 *         description: Company reactivated successfully
 */
router.patch("/:id/reactivate", reactivateCompany);

/**
 * @swagger
 * /api/companies/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a company (logical delete) (Admin)
 *     tags: [Companies]
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
 *         description: Company deactivated successfully
 */
router.patch("/:id/deactivate", deactivateCompany);

export default router;
