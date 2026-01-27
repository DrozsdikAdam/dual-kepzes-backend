import { Request, Response, NextFunction } from "express";
import { employeeService } from "../services/employee.service";
import { userService } from "../services/user.service";
import { logAction } from "../utils/logger";
import { Role } from "@prisma/client";
import { UpdateEmployeeInput } from "../schemas/employeeSchema";
import { getCompanyIdForUser } from "../utils/companyUtils";

export const getMeEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

        const employee = await employeeService.getProfile(userId);
        res.json(employee);
    } catch (error) {
        next(error);
    }
};

export const updateMeEmployee = async (req: Request<{}, {}, UpdateEmployeeInput>, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

        const updatedUser = await userService.update(userId, req.body, Role.MENTOR); // Assumed role for employee controller

        await logAction(req, {
            action: "UPDATE_MY_PROFILE",
            entity: "User",
            entityId: userId,
            details: { updatedFields: req.body }
        });

        res.json({
            success: true,
            message: "Profil sikeresen frissítve.",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMeEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

        await userService.delete(userId);

        await logAction(req, {
            action: "DELETE_MY_PROFILE",
            entity: "User",
            entityId: userId
        });

        res.json({ success: true, message: "Profil sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userToFind = req.params.id;
        const currentUser = req.user!;

        const target = await employeeService.getProfile(userToFind);
        const requester = await employeeService.getProfile(currentUser.userId);

        if (target.companyId !== requester.companyId) {
            return res.status(403).json({ message: "Nincs jogosultságod a dolgozó adatainak megtekintéséhez." });
        }

        await logAction(req, {
            action: "VIEW_EMPLOYEE",
            entity: "User",
            entityId: userToFind,
            details: { viewerId: currentUser.userId }
        });

        res.json(target);
    } catch (error) {
        next(error);
    }
};

export const getCompanyEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = await getCompanyIdForUser(req.user!.userId);
        if (!companyId || req.user!.role !== Role.COMPANY_ADMIN) {
            return res.status(403).json({ message: "Nincs jogosultságod a lista megtekintéséhez." });
        }

        const employees = await userService.getAllByRole([Role.MENTOR, Role.COMPANY_ADMIN], companyId);
        res.json(employees);
    } catch (error) {
        next(error);
    }
};

export const getCompanyMentors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = await getCompanyIdForUser(req.user!.userId);
        if (!companyId || req.user!.role !== Role.COMPANY_ADMIN) {
            return res.status(403).json({ message: "Nincs jogosultságod a lista megtekintéséhez." });
        }

        const mentors = await userService.getAllByRole(Role.MENTOR, companyId);
        res.json(mentors);
    } catch (error) {
        next(error);
    }
};

export const updateEmployeeById = async (req: Request<{ id: string }, {}, UpdateEmployeeInput>, res: Response, next: NextFunction) => {
    try {
        const userIdToUpdate = req.params.id;
        const currentUser = req.user!;

        const target = await employeeService.getProfile(userIdToUpdate);
        const requester = await employeeService.getProfile(currentUser.userId);

        const isSelf = userIdToUpdate === currentUser.userId;
        const isAdminAtSameCompany = currentUser.role === Role.COMPANY_ADMIN && target.companyId === requester.companyId;

        if (!isSelf && !isAdminAtSameCompany && currentUser.role !== Role.SYSTEM_ADMIN) {
            return res.status(403).json({ message: "Nincs jogosultságod más dolgozó adatainak módosításához." });
        }

        const updatedUser = await userService.update(userIdToUpdate, req.body, currentUser.role as Role);

        await logAction(req, {
            action: "UPDATE_EMPLOYEE",
            entity: "User",
            entityId: userIdToUpdate,
            details: {
                updatedFields: req.body,
                updatedBy: currentUser.userId
            }
        });

        res.json({ success: true, message: "Adatok sikeresen frissítve.", user: updatedUser });
    } catch (error) {
        next(error);
    }
};

export const deleteEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userIdToDelete = req.params.id;
        const target = await employeeService.getProfile(userIdToDelete);
        const requester = await employeeService.getProfile(req.user!.userId);

        if (target.companyId !== requester.companyId && req.user!.role !== Role.SYSTEM_ADMIN) {
            return res.status(403).json({ message: "Csak a saját céged dolgozóit törölheted." });
        }

        await userService.delete(userIdToDelete);

        await logAction(req, {
            action: "DELETE_EMPLOYEE",
            entity: "User",
            entityId: userIdToDelete,
            details: { deletedBy: req.user!.userId }
        });

        res.json({ success: true, message: "Munkavállaló sikeresen eltávolítva." });
    } catch (error) {
        next(error);
    }
};

export const getMyStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Nincs jogosultságod." });

        const partnerships = await employeeService.getMentorStudents(userId);
        res.json(partnerships);
    } catch (error) {
        next(error);
    }
};

export const getMyPartnershipById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ message: "Nincs jogosultságod." });

        const partnership = await employeeService.getMentorPartnership(userId, id);
        res.json(partnership);
    } catch (error) {
        next(error);
    }
};