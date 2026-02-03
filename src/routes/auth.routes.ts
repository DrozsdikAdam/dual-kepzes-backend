import { Router } from "express"
import { register, login, requestPasswordReset, resetPassword, verifyEmail, resendVerification } from "../controllers/auth.controller"
import { validate } from "../middlewares/validate.middleware"
import { RegisterSchema, LoginSchema, RequestPasswordResetSchema, ResetPasswordSchema, VerifyEmailSchema, ResendVerificationSchema } from "../schemas/auth.schema"

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
 *                 enum: [STUDENT, COMPANY_ADMIN, MENTOR, UNIVERSITY_USER, SYSTEM_ADMIN]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", validate(RegisterSchema), register);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(LoginSchema), login);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset email to the user if the email exists in the system. For security reasons, the endpoint always returns success even if the email doesn't exist.
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
 *                 example: user@example.com
 *                 description: Email address of the user requesting password reset
 *     responses:
 *       200:
 *         description: Password reset request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ha a megadott email cím regisztrálva van, elküldtük a jelszó visszaállító linket.
 *       400:
 *         description: Invalid email format
 */
router.post("/request-password-reset", validate(RequestPasswordResetSchema), requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: Resets the user's password using the token received via email. The token is valid for 1 hour.
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
 *                 example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
 *                 description: Password reset token received via email
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *                 maxLength: 64
 *                 pattern: ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$
 *                 example: NewSecurePassword123!
 *                 description: New password (12-64 characters, must contain uppercase, lowercase, number, and special character)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Jelszó sikeresen megváltoztatva.
 *       400:
 *         description: Invalid or expired token, or invalid password format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_INPUT
 *                     message:
 *                       type: string
 *                       example: Érvénytelen vagy lejárt token.
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
 *                 example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
 *                 description: Verification token received via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email cím sikeresen megerősítve.
 *       400:
 *         description: Invalid or expired token
 */
router.post("/verify-email", validate(VerifyEmailSchema), verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resends the email verification link to the user.
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
 *                 example: user@example.com
 *                 description: Email address of the user
 *     responses:
 *       200:
 *         description: Verification email resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: A megerősítő levelet újra elküldtük.
 */
router.post("/resend-verification", validate(ResendVerificationSchema), resendVerification);

export default router;
