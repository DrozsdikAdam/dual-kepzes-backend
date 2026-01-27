import { Request, Response, NextFunction } from "express";
import { companyService } from "../services/company.service";
import { logAction } from "../utils/logger";
import { CompanyInput } from "../schemas/jobSchema";
import { mapCompany, mapPosition } from "../utils/mappers";

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
     try {
          const companies = await companyService.getAll();
          res.json(companies.map(mapCompany));
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

          const mappedCompany = mapCompany(company);
          if (mappedCompany.positions) {
               mappedCompany.positions = mappedCompany.positions.map(mapPosition);
          }

          res.json(mappedCompany);
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
          const inactiveCompanies = await companyService.getInactive();
          res.json(inactiveCompanies.map(mapCompany));
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
     } catch (error) {
          next(error);
     }
};
