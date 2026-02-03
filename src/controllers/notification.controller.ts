import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { UnauthorizedError } from "../errors/AppError";

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          const notifications = await notificationService.getByUser(userId, false);
          res.json({ success: true, data: notifications });
     } catch (error) {
          next(error);
     }
};

export const getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          const notification = await notificationService.getById(id, userId);
          res.json({ success: true, data: notification });
     } catch (error) {
          next(error);
     }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          await notificationService.markAsRead(id, userId);
          res.json({ success: true, message: "Értékelés sikeresen olvasottnak jelölve." });
     } catch (error) {
          next(error);
     }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          await notificationService.markAllAsRead(userId);
          res.json({ success: true, message: "Az összes értesítés olvasottnak jelölve." });
     } catch (error) {
          next(error);
     }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          await notificationService.delete(id, userId);
          res.json({ success: true, message: "Értékelés sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const archiveNotification = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          await notificationService.setArchiveStatus(id, userId, true);
          res.json({ success: true, message: "Értékelés sikeresen archiválva." });
     } catch (error) {
          next(error);
     }
};

export const getArchivedNotifications = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          const notifications = await notificationService.getByUser(userId, true);
          res.json({ success: true, data: notifications });
     } catch (error) {
          next(error);
     }
};

export const unarchiveNotification = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          await notificationService.setArchiveStatus(id, userId, false);
          res.json({ success: true, message: "Értékelés sikeresen visszaállítva." });
     } catch (error) {
          next(error);
     }
};

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               throw new UnauthorizedError();
          }

          const notification = await notificationService.create({
               userId,
               ...req.body
          });

          res.status(201).json({ success: true, data: notification });
     } catch (error) {
          next(error);
     }
};

export const getUnreadNotificationsCount = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." });
          }

          const count = await notificationService.getUnreadCount(userId);
          res.json({ success: true, data: { unreadNotificationsCount: count } });
     } catch (error) {
          next(error);
     }
};