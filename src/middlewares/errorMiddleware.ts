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
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] --- SZERVER OLDALI HIBA ---`);
    console.error(`Method: ${req.method}, URL: ${req.url}`);
    console.error(`Error Name: ${err.name}`);
    console.error(`Error Message: ${err.message}`);
    if (err.stack) console.error(err.stack);

    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'A CORS szabályzat tiltja ezt a kérést az adott forrásból.',
            error: {
                code: ErrorCodes.FORBIDDEN,
                message: 'CORS hiba: Az Origin nem szerepel az engedélyezett listán.',
            },
        });
    }

    // Handle JSON syntax errors
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Érvénytelen JSON formátum.',
            error: {
                code: ErrorCodes.BAD_REQUEST,
                message: 'A kérés törzse érvénytelen JSON adatokat tartalmaz (pl. hiányzó idézőjelek).',
            },
        });
    }

    // Handle known application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message, // Top-level message for UI compatibility
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
            message: 'Validációs hiba.',
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: 'Validációs hiba.',
                details: err.issues,
            },
        });
    }

    // Handle Prisma Client errors (including connection limits)
    const isPrismaError = err.name?.includes('Prisma') || err.code?.startsWith('P');
    if (isPrismaError || err.name === 'PrismaClientValidationError') {
        const isConnLimit = err.message?.includes("Max client connections reached") ||
            err.message?.includes("connection limit") ||
            err.code === 'P2024';

        const isValidationError = err.name === 'PrismaClientValidationError';

        return res.status(isConnLimit ? 503 : 400).json({
            success: false,
            message: isConnLimit
                ? 'Az adatbázis jelenleg túlterhelt, kérjük próbálja újra később.'
                : isValidationError
                    ? 'Adatbázis validációs hiba (hibás paraméterek).'
                    : 'Adatbázis hiba történt.',
            error: {
                code: isConnLimit ? "DATABASE_CONNECTION_LIMIT" : ErrorCodes.DATABASE_ERROR,
                message: isConnLimit
                    ? 'Az adatbázis jelenleg túlterhelt, kérjük próbálja újra később.'
                    : isValidationError
                        ? 'Adatbázis validációs hiba (hibás paraméterek).'
                        : 'Adatbázis hiba történt.',
                ...(process.env.NODE_ENV === 'development' && {
                    details: err.meta,
                    originalError: err.message,
                    code: err.code
                })
            },
        });
    }

    // Unknown/unexpected errors
    const statusCode = err.statusCode || 500;
    const message = err.message || "Belső szerver hiba";

    // DEBUG: Eredeti hiba megmutatása a válaszban a könnyebb hibakeresésért (később visszavehetjük)
    const isProd = process.env.NODE_ENV === "production";

    res.status(statusCode).json({
        success: false,
        message: isProd ? `Belső szerver hiba történt. (DEBUG: ${message})` : message,
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: isProd ? `Belső szerver hiba történt. (DEBUG: ${message})` : message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack })
        }
    });
};
