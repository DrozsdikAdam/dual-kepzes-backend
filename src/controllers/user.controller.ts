import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { logAction } from "../utils/logger.util";
import { getPaginationParams } from "../utils/pagination.util";
import { UnauthorizedError } from "../errors/AppError";

export const getInactiveUsers = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await userService.getInactive(params);
          res.json({
               success: true,
               data: result.data,
               pagination: result.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const reactivateUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const user = await userService.setStatus(id, true);

          await logAction(req, {
               action: "REACTIVATE_USER",
               entity: "User",
               entityId: id,
               details: { reactivatedBy: req.user?.userId }
          });

          res.json({ success: true, message: "Felhasználó sikeresen újraaktiválva.", data: user });
     } catch (error) {
          next(error);
     }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const user = await userService.setStatus(id, false);

          await logAction(req, {
               action: "DEACTIVATE_USER",
               entity: "User",
               entityId: id,
               details: { deactivatedBy: req.user?.userId }
          });

          res.json({ success: true, message: "Felhasználó sikeresen deaktiválva.", data: user });
     } catch (error) {
          next(error);
     }
};
