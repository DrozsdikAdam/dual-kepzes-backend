import { Router } from "express";
import { deleteEmployeeById, getCompanyEmployees, getEmployeeById, updateEmployeeById, getMeEmployee, updateMeEmployee, deleteMeEmployee, getMyStudents, getMyPartnershipById, getCompanyMentors } from "../controllers/employee.controller";
import { UpdateEmployeeSchema } from "../schemas/employee.schema";
import { validate } from "../middlewares/validate.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Company employee and mentor management
 */

/**
 * @swagger
 * /api/employees/me:
 *   get:
 *     summary: Get my own employee profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My employee profile details
 */
router.get("/me", authenticateToken, getMeEmployee);

/**
 * @swagger
 * /api/employees/me:
 *   patch:
 *     summary: Update my own employee profile
 *     tags: [Employees]
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
router.patch("/me", authenticateToken, validate(UpdateEmployeeSchema), updateMeEmployee);

/**
 * @swagger
 * /api/employees/me:
 *   delete:
 *     summary: Delete my own employee account
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete("/me", authenticateToken, deleteMeEmployee);

/**
 * @swagger
 * /api/employees/me/students:
 *   get:
 *     summary: List students assigned to me (for Mentors)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned students
 */
router.get("/me/students", authenticateToken, getMyStudents);

/**
 * @swagger
 * /api/employees/me/students/{id}:
 *   get:
 *     summary: Get details of a student assigned to me
 *     tags: [Employees]
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
 *         description: Assigned student/partnership details
 */
router.get("/me/students/:id", authenticateToken, getMyPartnershipById);

/**
 * @swagger
 * /api/employees/mentors:
 *   get:
 *     summary: List all mentors at my company
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company mentors
 */
router.get("/mentors", authenticateToken, getCompanyMentors);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: List all employees at my company
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company employees
 */
router.get("/", authenticateToken, getCompanyEmployees)

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee details by ID
 *     tags: [Employees]
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
 *         description: Employee details
 */
router.get("/:id", authenticateToken, getEmployeeById)

/**
 * @swagger
 * /api/employees/{id}:
 *   patch:
 *     summary: Update an employee by ID (Company Admin)
 *     tags: [Employees]
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
router.patch("/:id", authenticateToken, validate(UpdateEmployeeSchema), updateEmployeeById);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee by ID (Company Admin)
 *     tags: [Employees]
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
router.delete("/:id", authenticateToken, deleteEmployeeById)

export default router;