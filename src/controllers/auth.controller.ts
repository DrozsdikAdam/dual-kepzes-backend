import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { RegisterInput, LoginInput, RequestPasswordResetInput, ResetPasswordInput, VerifyEmailInput, ResendVerificationInput } from "../schemas/auth.schema";
import { logAction } from "../utils/logger.util";

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) => {
    try {
        const newUser = await authService.register(req.body);

        await logAction(req, {
            action: "USER_REGISTERED",
            entity: "User",
            entityId: newUser.id,
            details: {
                email: newUser.email,
                role: newUser.role,
                fullName: newUser.fullName
            }
        });

        res.status(201).json({
            success: true,
            message: "Sikeres regisztráció",
            userId: newUser.id,
            role: newUser.role
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
    try {
        const result = await authService.login(req.body);

        await logAction(req, {
            action: "USER_LOGIN",
            entity: "User",
            entityId: result.user.id,
            details: { email: result.user.email, role: result.user.role }
        });

        res.json({
            success: true,
            message: "Sikeres bejelentkezés",
            token: result.token,
            user: result.user
        });
    } catch (error) {
        next(error);
    }
};

export const requestPasswordReset = async (req: Request<{}, {}, RequestPasswordResetInput>, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const result = await authService.requestPasswordReset(email);

        await logAction(req, {
            action: "PASSWORD_RESET_REQUESTED",
            entity: "User",
            entityId: undefined,
            details: { email }
        });

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request<{}, {}, ResetPasswordInput>, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        const result = await authService.resetPassword(token, newPassword);

        await logAction(req, {
            action: "PASSWORD_RESET_COMPLETED",
            entity: "User",
            entityId: undefined,
            details: { tokenUsed: true }
        });

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req: Request<{}, {}, VerifyEmailInput>, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);

        await logAction(req, {
            action: "EMAIL_VERIFIED",
            entity: "User",
            entityId: result.userId,
            details: { tokenUsed: true }
        });

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req: Request<{}, {}, ResendVerificationInput>, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const result = await authService.resendVerification(email);

        await logAction(req, {
            action: "RESEND_VERIFICATION_EMAIL",
            entity: "User",
            entityId: result.userId,
            details: { email }
        });

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

