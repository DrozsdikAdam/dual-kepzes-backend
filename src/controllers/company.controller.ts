import { Request, Response, NextFunction } from "express";
import { companyService } from "../services/company.service";
import { notifySystemAdmins } from "../utils/notification.util";
import { NOTIFICATION_TYPES } from "../utils/constants";
import { NotFoundError } from "../errors/AppError";
import { logAction } from "../utils/logger.util";
import { CompanyInput } from "../schemas/job.schema";
import { CompanyWithAdminInput } from "../schemas/company.schema";
import { mapCompany, mapPosition } from "../utils/mapper.util";
import { getPaginationParams } from "../utils/pagination.util";
import { Role } from "@prisma/client";

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await companyService.getAll(params);
          res.json({
               success: true,
               data: result.data.map(mapCompany),
               pagination: result.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const company = await companyService.getById(id);

          await logAction(req, {
               action: "VIEW_COMPANY",
               entity: "Company",
               entityId: id,
               details: { viewById: req.user?.userId, name: company.name }
          });

          const mappedCompany = mapCompany(company as any);
          if (!mappedCompany) {
               throw new NotFoundError('Cég');
          }

          if (mappedCompany.positions) {
               mappedCompany.positions = mappedCompany.positions.map(mapPosition).filter((p): p is any => p !== null);
          }

          res.json({
               success: true,
               data: mappedCompany
          });
     } catch (error) {
          next(error);
     }
};

export const createCompany = async (
     req: Request<{}, {}, CompanyInput>,
     res: Response,
     next: NextFunction
) => {
     try {
          const newCompany = await companyService.create(req.body);

          await logAction(req, {
               action: "CREATE_COMPANY",
               entity: "Company",
               entityId: newCompany.id,
               details: { createdById: req.user?.userId, name: newCompany.name, taxId: newCompany.taxId }
          });

          res.status(201).json({
               success: true,
               message: "Sikeres cég létrehozás",
               data: mapCompany(newCompany)
          });
     } catch (error) {
          next(error);
     }
};

export const createCompanyWithAdmin = async (
     req: Request<{}, {}, CompanyWithAdminInput>,
     res: Response,
     next: NextFunction
) => {
     try {
          const newCompany = await companyService.createWithAdmin(req.body);

          await logAction(req, {
               action: "CREATE_COMPANY_WITH_ADMIN",
               entity: "Company",
               entityId: newCompany!.id,
               details: { createdById: req.user?.userId, name: newCompany!.name, taxId: newCompany!.taxId }
          });

          res.status(201).json({
               success: true,
               message: "Cég és admin sikeresen létrehozva",
               data: mapCompany(newCompany)
          });

          // Értesítés a rendszergazdáknak
          await notifySystemAdmins({
               title: "Új cég regisztráció",
               message: `Új cég került rögzítésre: "${newCompany!.name}" (adószám: ${newCompany!.taxId}).`,
               type: NOTIFICATION_TYPES.COMPANY_CREATE
          });
     } catch (error) {
          next(error);
     }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const updated = await companyService.update(id, req.body);

          await logAction(req, {
               action: "UPDATE_COMPANY",
               entity: "Company",
               entityId: id,
               details: { updatedById: req.user?.userId, updatedFields: Object.keys(req.body) }
          });

          res.json({
               success: true,
               message: "Cég adatai frissítve",
               data: mapCompany(updated)
          });

          // Értesítés a rendszergazdáknak
          await notifySystemAdmins({
               title: "Cégadatok változása",
               message: `A(z) "${updated.name}" cég adatai frissültek.`,
               type: NOTIFICATION_TYPES.COMPANY_UPDATE
          });
     } catch (error) {
          next(error);
     }
};

export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          await companyService.delete(id);

          await logAction(req, {
               action: "DELETE_COMPANY",
               entity: "Company",
               entityId: id,
               details: { name: id, deletedById: req.user?.userId }
          });

          res.json({ success: true, message: "Cég és kapcsolódó pozíciói törölve." });
     } catch (error) {
          next(error);
     }
};

export const getInactiveCompanies = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await companyService.getInactive(params);
          res.json({
               success: true,
               data: result.data.map(mapCompany),
               pagination: result.pagination
          });
     } catch (error) {
          next(error);
     }
};

export const reactivateCompany = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const updatedCompany = await companyService.setStatus(id, true);

          await logAction(req, {
               action: "REACTIVATE_COMPANY",
               entity: "Company",
               entityId: id,
               details: { reactivatedBy: req.user?.userId }
          });

          res.json({
               success: true,
               message: "Cég sikeresen újraaktiválva.",
               data: mapCompany(updatedCompany)
          });

          // Értesítés a rendszergazdáknak
          await notifySystemAdmins({
               title: "Cég újraaktiválva",
               message: `A(z) "${updatedCompany.name}" cég újraaktiválásra került.`,
               type: NOTIFICATION_TYPES.COMPANY_STATUS
          });
     } catch (error) {
          next(error);
     }
};

export const deactivateCompany = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const { id } = req.params;
          const updatedCompany = await companyService.setStatus(id, false);

          await logAction(req, {
               action: "DEACTIVATE_COMPANY",
               entity: "Company",
               entityId: id,
               details: { deactivatedBy: req.user?.userId }
          });

          res.json({
               success: true,
               message: "Cég sikeresen deaktiválva.",
               data: mapCompany(updatedCompany)
          });

          // Értesítés a rendszergazdáknak
          await notifySystemAdmins({
               title: "Cég deaktiválva",
               message: `A(z) "${updatedCompany.name}" cég deaktiválásra került.`,
               type: NOTIFICATION_TYPES.COMPANY_STATUS
          });
     } catch (error) {
          next(error);
     }
};

export const getOwnApplicationCompanies = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const params = getPaginationParams(req.query);
          const result = await companyService.getOwnApplicationCompanies(params);
          res.json({
               success: true,
               data: result.data.map(mapCompany),
               pagination: result.pagination
          });
     } catch (error) {
          next(error);
     }
};
