import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { ZodError } from "zod";
import { ErrorCodes } from "../constants";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // BIZTONSÁGI FÉK: Ha a válasz már elment, ne próbáljunk újat küldeni
    if (res.headersSent) {
        return next(err);
    }

    // A korábbi megoldáshoz hűen konzolra írjuk a hibát
    console.error("--- SZERVER OLDALI HIBA NAPLÓ ---");
    console.error(err);
    if (err.stack) console.error(err.stack);

    // Handle known application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details && { details: err.details }),
            },
        });
    }

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: 'Validációs hiba.',
                details: err.issues,
            },
        });
    }

    // Handle Prisma Client errors (example: unique constraint)
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCodes.DATABASE_ERROR,
                message: 'Adatbázis hiba történt.',
                ...(process.env.NODE_ENV === 'development' && { details: err.meta })
            },
        });
    }

    // Unknown/unexpected errors
    const statusCode = err.statusCode || 500;
    const message = err.message || "Belső szerver hiba";

    res.status(statusCode).json({
        success: false,
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: process.env.NODE_ENV === "development" ? message : (err.message || "Belső szerver hiba"),
            ...(process.env.NODE_ENV === "development" && { stack: err.stack })
        }
    });
};