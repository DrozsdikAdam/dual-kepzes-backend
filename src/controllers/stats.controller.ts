import { Request, Response, NextFunction } from "express";
import { statsService } from "../services/stats.service";
import { UnauthorizedError } from "../errors/AppError";
import { employeeService } from "../services/employee.service";

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

export const getUniversityStudentDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError("Nincs azonosított felhasználó.");

        const stats = await statsService.getUniversityStudentDistribution(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getMyCompanyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Nincs azonosított felhasználó." });
        }

        const profile = await employeeService.getProfile(userId);
        if (!profile || !profile.companyId) {
            return res.status(403).json({ success: false, message: "Nincs céghez rendelve." });
        }

        const stats = await statsService.getCompanyStats(profile.companyId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getReferentOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError("Nincs azonosított felhasználó.");

        const stats = await statsService.getReferentOverview(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getAllReferentsCompaniesStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await statsService.getAllReferentsCompaniesStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};
