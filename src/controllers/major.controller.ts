import { Request, Response, NextFunction } from "express";
import { majorService } from "../services/major.service";
import { logAction } from "../utils/logger.util";
import { getPaginationParams } from "../utils/pagination.util";

export const createMajor = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const major = await majorService.create(req.body);

          await logAction(req, {
               action: "CREATE_MAJOR",
               entity: "Major",
               entityId: major.id,
               details: {
                    createdById: req.user?.userId,
                    name: major.name,
                    language: major.language
               }
          });

          res.status(201).json({
               success: true,
               message: "Szak sikeresen létrehozva.",
               data: major
          });
     } catch (error) {
          next(error);
     }
};

export const getAllMajors = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await majorService.getAll(params);

          res.json({
               success: true,
               data: result.data,
               pagination: result.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const getMajorById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const major = await majorService.getById(id);

          res.json({
               success: true,
               data: major
          });
     } catch (error) {
          next(error);
     }
};

export const updateMajor = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const major = await majorService.update(id, req.body);

          await logAction(req, {
               action: "UPDATE_MAJOR",
               entity: "Major",
               entityId: id,
               details: {
                    updatedById: req.user?.userId,
                    name: major.name,
                    language: major.language
               }
          });

          res.json({
               success: true,
               message: "Szak sikeresen frissítve.",
               data: major
          });
     } catch (error) {
          next(error);
     }
};

export const deleteMajor = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await majorService.delete(id);

          await logAction(req, {
               action: "DELETE_MAJOR",
               entity: "Major",
               entityId: id,
               details: { deletedById: req.user?.userId }
          });

          res.json({
               success: true,
               message: "Szak sikeresen törölve."
          });
     } catch (error) {
          next(error);
     }
};
