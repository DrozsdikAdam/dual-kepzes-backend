import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { universityUserService } from "../services/universityUser.service";
import { logAction } from "../utils/logger.util";
import { Role } from "@prisma/client";
import { getPaginationParams } from "../utils/pagination.util";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";
import { AssignMajorsInput, AssignCompaniesInput } from "../schemas/universityUser.schema";

export const getMeUniversityUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) throw new UnauthorizedError("Nincs azonosított felhasználó.");

          const user = await userService.getById(userId, Role.UNIVERSITY_USER);
          res.json({ success: true, data: user });
     } catch (error) {
          next(error);
     }
};

export const updateMeUniversityUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          const updatedUser = await userService.update(userId, req.body, Role.UNIVERSITY_USER);

          await logAction(req, {
               action: "UPDATE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: {
                    updatedBy: userId,
                    changes: req.body
               }
          });

          res.json({ success: true, message: "Profil sikeresen frissítve.", user: updatedUser });
     } catch (error) {
          next(error);
     }
};

export const deleteMeUniversityUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." });

          await userService.delete(userId);

          await logAction(req, {
               action: "DELETE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: { deletedById: userId }
          });

          res.json({ success: true, message: "A profil sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const getUniversityUsers = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await userService.getAllByRole(Role.UNIVERSITY_USER, undefined, params);
          const paginated = result as any;

          res.json({
               success: true,
               data: paginated.data,
               pagination: paginated.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const getUniversityUserById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const user = await userService.getById(id, Role.UNIVERSITY_USER);

          await logAction(req, {
               action: "VIEW_UNIVERSITY_USER_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedById: req.user?.userId }
          });

          res.json({ success: true, data: user });
     } catch (error) {
          next(error);
     }
};

export const updateUniversityUserById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const currentUser = req.user!;

          // Check permissions: Self or System Admin
          if (id !== currentUser.userId && currentUser.role !== Role.SYSTEM_ADMIN) {
               throw new ForbiddenError("Nincs jogosultságod a művelet elvégzéséhez.");
          }

          const updatedUser = await userService.update(id, req.body, currentUser.role as Role);

          await logAction(req, {
               action: "UPDATE_UNIVERSITY_USER",
               entity: "User",
               entityId: id,
               details: {
                    updatedBy: currentUser.userId,
                    changes: req.body
               }
          });

          res.json({ success: true, message: "Adatok sikeresen frissítve.", user: updatedUser });
     } catch (error) {
          next(error);
     }
};

export const deleteUniversityUser = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await userService.getById(id, Role.UNIVERSITY_USER); // Check exists
          await userService.delete(id);

          await logAction(req, {
               action: "DELETE_UNIVERSITY_USER",
               entity: "User",
               entityId: id,
               details: { deletedById: req.user?.userId }
          });

          res.json({ success: true, message: "A rekord sikeresen törölve." });
     } catch (error) {
          next(error);
     }
};

export const getMyAssignments = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const userId = req.user?.userId;
          if (!userId) throw new UnauthorizedError("Nincs azonosított felhasználó.");
          
          const assignments = await universityUserService.getReferentAssignments(userId);
          res.json({ success: true, data: assignments });
     } catch (error) {
          next(error);
     }
};

export const assignMajorsToReferent = async (
     req: Request<{ id: string }, {}, AssignMajorsInput>,
     res: Response,
     next: NextFunction
) => {
     try {
          const { id } = req.params;
          const result = await universityUserService.assignMajors(id, req.body.majorIds);

          await logAction(req, {
               action: "ASSIGN_MAJORS_TO_REFERENT",
               entity: "User",
               entityId: id,
               details: { majorIds: req.body.majorIds }
          });

          res.json({ success: true, message: "Szakok sikeresen hozzárendelve.", data: result });
     } catch (error) {
          next(error);
     }
};

export const assignCompaniesToReferent = async (
     req: Request<{ id: string }, {}, AssignCompaniesInput>,
     res: Response,
     next: NextFunction
) => {
     try {
          const { id } = req.params;
          const result = await universityUserService.assignCompanies(id, req.body.companyIds);

          await logAction(req, {
               action: "ASSIGN_COMPANIES_TO_REFERENT",
               entity: "User",
               entityId: id,
               details: { companyIds: req.body.companyIds }
          });

          res.json({ success: true, message: "Cégek sikeresen hozzárendelve.", data: result });
     } catch (error) {
          next(error);
     }
};

export const listAllReferents = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const referents = await universityUserService.getAllReferents();
          res.json({ success: true, data: referents });
     } catch (error) {
          next(error);
     }
};
