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

export const getApplicationStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getApplicationStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getPartnershipStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getPartnershipStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getPositionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getPositionStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getTrendStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getTrendStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};