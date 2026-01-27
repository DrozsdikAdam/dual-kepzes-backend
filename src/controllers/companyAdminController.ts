import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { logAction } from "../utils/logger";
import { Role } from "@prisma/client";
import { getPaginationParams } from "../utils/pagination";

export const getMeCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          const user = await userService.getById(userId, Role.COMPANY_ADMIN);
          res.json(user);
     } catch (error) {
          next(error);
     }
};

export const updateMeCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          const updated = await userService.update(userId, req.body, Role.COMPANY_ADMIN);

          await logAction(req, {
               action: "UPDATE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: { changes: req.body }
          });

          res.json({ success: true, message: "Saját adatok frissítve.", user: updated });
     } catch (error) {
          next(error);
     }
};

export const deleteMeCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          await userService.delete(userId);

          await logAction(req, {
               action: "DELETE_MY_PROFILE",
               entity: "User",
               entityId: userId
          });

          res.json({ success: true, message: "A profil sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const getCompanyAdmins = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await userService.getAllByRole(Role.COMPANY_ADMIN, undefined, params);

          // userService.getAllByRole with params returns PaginationResult
          const paginated = result as any;

          await logAction(req, {
               action: "LIST_COMPANY_ADMINS",
               entity: "User",
               details: { count: paginated.data.length, total: paginated.pagination.total }
          });

          res.json({
               success: true,
               data: paginated.data,
               pagination: paginated.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const getCompanyAdminById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const admin = await userService.getById(id, Role.COMPANY_ADMIN);

          await logAction(req, {
               action: "VIEW_ADMIN_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedEmail: admin.email }
          });

          res.json(admin);
     } catch (error) {
          next(error);
     }
};

export const updateCompanyAdminById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const currentUser = req.user!;

          // Permission: Self or System Admin
          if (id !== currentUser.userId && currentUser.role !== Role.SYSTEM_ADMIN) {
               return res.status(403).json({ message: "Nincs jogosultságod a módosításhoz." });
          }

          const updated = await userService.update(id, req.body, currentUser.role as Role);

          await logAction(req, {
               action: "UPDATE_COMPANY_ADMIN",
               entity: "User",
               entityId: id,
               details: { changes: req.body }
          });

          res.json({ success: true, message: "Cégadmin adatok frissítve.", user: updated });
     } catch (error) {
          next(error);
     }
};

export const deleteCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await userService.getById(id, Role.COMPANY_ADMIN); // Check exists
          await userService.delete(id);

          await logAction(req, {
               action: "DELETE_COMPANY_ADMIN",
               entity: "User",
               entityId: id
          });

          res.json({ success: true, message: "A rekord sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const restoreCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const updated = await userService.restore(id);
          res.json({ success: true, data: updated });
     } catch (error) {
          next(error);
     }
};
