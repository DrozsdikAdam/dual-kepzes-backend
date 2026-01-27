import { Request, Response, NextFunction } from "express";
import { newsService } from "../services/news.service";
import { logAction } from "../utils/logger";

export const createNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const news = await newsService.create(req.body);

          await logAction(req, {
               action: "CREATE_NEWS",
               entity: "News",
               entityId: news.id,
               details: {
                    createdById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          });

          res.status(201).json({
               success: true,
               message: "Hír sikeresen létrehozva.",
               data: news
          });
     } catch (error) {
          next(error);
     }
};

export const getUserNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const role = req.user?.role;
          const news = await newsService.getAll(role, false);
          res.json({ success: true, data: news });
     } catch (error) {
          next(error);
     }
};

export const getUserNewsById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const news = await newsService.getById(id, false);
          res.json({ success: true, data: news });
     } catch (error) {
          next(error);
     }
};

export const getAdminNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const news = await newsService.getAll('SYSTEM_ADMIN', false);
          res.json({ success: true, data: news });
     } catch (error) {
          next(error);
     }
};

export const getAdminNewsById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const news = await newsService.getById(id);
          res.json({ success: true, data: news });
     } catch (error) {
          next(error);
     }
};

export const archiveNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const news = await newsService.setArchiveStatus(id, true);

          await logAction(req, {
               action: "ARCHIVE_NEWS",
               entity: "News",
               entityId: id,
               details: {
                    updatedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          });

          res.json({
               success: true,
               message: "Hír sikeresen archiválva.",
               data: news
          });
     } catch (error) {
          next(error);
     }
};

export const unarchiveNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const news = await newsService.setArchiveStatus(id, false);

          await logAction(req, {
               action: "UNARCHIVE_NEWS",
               entity: "News",
               entityId: id,
               details: {
                    updatedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          });

          res.json({
               success: true,
               message: "Hír sikeresen visszaállítva.",
               data: news
          });
     } catch (error) {
          next(error);
     }
};

export const updateNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const news = await newsService.update(id, req.body);

          await logAction(req, {
               action: "UPDATE_NEWS",
               entity: "News",
               entityId: id,
               details: {
                    updatedById: req.user?.userId,
                    title: news.title,
                    targetGroup: news.targetGroup
               }
          });

          res.json({
               success: true,
               message: "Hír sikeresen frissítve.",
               data: news
          });
     } catch (error) {
          next(error);
     }
};

export const deleteNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await newsService.delete(id);

          await logAction(req, {
               action: "DELETE_NEWS",
               entity: "News",
               entityId: id,
               details: { deletedById: req.user?.userId }
          });

          res.json({ success: true, message: "Hír sikeresen törölve lett." });
     } catch (error) {
          next(error);
     }
};

export const getArchivedNews = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const news = await newsService.getAll('SYSTEM_ADMIN', true);
          res.json({ success: true, data: news });
     } catch (error) {
          next(error);
     }
};