// errorMiddleware.ts javítása
import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // A Railway logokban így fogod látni a pontos hiba okát (pl. Prisma hiba)
    console.error("--- SZERVER OLDALI HIBA NAPLÓ ---");
    console.error(err.stack);

    // BIZTONSÁGI FÉK: Ha a válasz már elment, ne próbáljunk újat küldeni
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Belső szerver hiba";

    res.status(statusCode).json({
        status: "error",
        message: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
}