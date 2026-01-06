import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err.stack)

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Belső szerver hiba'

    res.status(statusCode).json({
        status: 'error',
        message: message,
        // Fejlesztői módban visszaküldjük a stack trace-t is hibakereséshez
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}