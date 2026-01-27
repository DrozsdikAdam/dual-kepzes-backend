import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { logAction } from "../utils/logger";
import { Role } from "@prisma/client";

export const getMeSystemAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs azonosított felhasználó." });
          }

          const user = await userService.getById(userId, Role.SYSTEM_ADMIN);
          res.json(user);
     } catch (error) {
          next(error);
     }
};

export const updateMeSystemAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          const updated = await userService.update(userId, req.body, Role.SYSTEM_ADMIN);

          await logAction(req, {
               action: "UPDATE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: {
                    updatedBy: userId,
                    changes: req.body
               }
          });

          res.json({ success: true, message: "Profil sikeresen frissítve.", user: updated });
     } catch (error) {
          next(error);
     }
};

export const deleteMeSystemAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          await userService.delete(userId);

          await logAction(req, {
               action: "DELETE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: { deletedBy: userId }
          });

          res.json({ success: true, message: "A profil sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const getSystemAdmins = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const admins = await userService.getAllByRole(Role.SYSTEM_ADMIN);

          await logAction(req, {
               action: "LIST_SYSTEM_ADMINS",
               entity: "User",
               details: { listById: req.user?.userId, count: admins.length }
          });

          res.json(admins);
     } catch (error) {
          next(error);
     }
};

export const getSystemAdminById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const admin = await userService.getById(id, Role.SYSTEM_ADMIN);

          await logAction(req, {
               action: "VIEW_SYSTEM_ADMIN_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedById: req.user?.userId, viewedEmail: admin.email }
          });

          res.json(admin);
     } catch (error) {
          next(error);
     }
};

export const updateSystemAdminById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const updated = await userService.update(id, req.body, Role.SYSTEM_ADMIN);

          await logAction(req, {
               action: "UPDATE_SYSTEM_ADMIN",
               entity: "User",
               entityId: id,
               details: {
                    updatedBy: req.user?.userId,
                    changes: req.body
               }
          });

          res.json({ success: true, message: "Rendszeradmin adatai sikeresen frissítve.", user: updated });
     } catch (error) {
          next(error);
     }
};

export const deleteSystemAdmin = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await userService.getById(id, Role.SYSTEM_ADMIN); // Check if exists and is admin
          await userService.delete(id);

          await logAction(req, {
               action: "DELETE_SYSTEM_ADMIN",
               entity: "User",
               entityId: id,
               details: { deletedBy: req.user?.userId }
          });

          res.json({ success: true, message: "A rekord sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const getAllAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const admins = await userService.getAllByRole([Role.SYSTEM_ADMIN, Role.COMPANY_ADMIN, Role.UNIVERSITY_USER]);

          await logAction(req, {
               action: "LIST_ALL_ADMINS",
               entity: "User",
               details: { count: admins.length }
          });

          res.json(admins);
     } catch (error) {
          next(error);
     }
};