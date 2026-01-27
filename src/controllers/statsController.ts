import { Request, Response, NextFunction } from "express";
import { statsService } from "../services/stats.service";

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getSystemStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};