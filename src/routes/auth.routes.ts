import { Router } from "express";
import {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerification,
    registerCompanyAdmin,
    registerSystemAdmin
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
    RegisterSchema,
    LoginSchema,
    RequestPasswordResetSchema,
    ResetPasswordSchema,
    VerifyEmailSchema,
    ResendVerificationSchema,
    CompanyAdminRegisterSchema,
    SystemAdminRegisterSchema
} from "../schemas/auth.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phoneNumber
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [STUDENT, MENTOR, UNIVERSITY_USER]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid payload
 */
router.post("/register", validate(RegisterSchema), register);

/**
 * @swagger
 * /api/auth/register/company-admin:
 *   post:
 *     summary: Register a new company administrator
 *     description: Creates a user with COMPANY_ADMIN role and links it to an existing company.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phoneNumber
 *               - companyId
 *               - jobTitle
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 12
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               jobTitle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company admin registered successfully
 *       400:
 *         description: Invalid payload or duplicate email
 */
router.post("/register/company-admin", validate(CompanyAdminRegisterSchema), registerCompanyAdmin);

/**
 * @swagger
 * /api/auth/register/system-admin:
 *   post:
 *     summary: Register a new system administrator
 *     description: Creates a user with SYSTEM_ADMIN role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 12
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: System admin registered successfully
 *       400:
 *         description: Invalid payload or duplicate email
 */
router.post("/register/system-admin", validate(SystemAdminRegisterSchema), registerSystemAdmin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *                - email
 *                - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Login blocked by business rule
 *       403:
 *         description: Inactive account
 */
router.post("/login", validate(LoginSchema), login);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request a password reset
 *     description: Always returns success-style behavior even if the email does not exist.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset request processed
 *       400:
 *         description: Invalid email format
 */
router.post("/request-password-reset", validate(RequestPasswordResetSchema), requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: Resets the user's password using the token received via email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 32
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *                 maxLength: 64
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token, or invalid password format
 *       401:
 *         description: User account is inactive
 */
router.post("/reset-password", validate(ResetPasswordSchema), resetPassword);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     description: Verifies the user's email address using the token received via email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 32
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/verify-email", validate(VerifyEmailSchema), verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resends the verification flow for a user email address.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification request processed
 *       400:
 *         description: Email is already verified or payload is invalid
 */
router.post("/resend-verification", validate(ResendVerificationSchema), resendVerification);

export default router;
