import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";
import { CompanyInput } from "../schemas/jobSchema";

const companySelect = {
     id: true,
     name: true,
     taxId: true,
     hqCountry: true,
     hqZipCode: true,
     hqCity: true,
     hqAddress: true,
     contactName: true,
     contactEmail: true,
     website: true,
     logoUrl: true,
     isActive: true,
     createdAt: true,
     deletedAt: true
};

const positionSelect = {
     id: true,
     title: true,
     description: true,
     zipCode: true,
     city: true,
     address: true,
     deadline: true,
     isActive: true,
     isDual: true,
     createdAt: true,
     updatedAt: true,
     tags: {
          select: {
               name: true,
               category: true
          }
     }
};

export const getAllCompanies = async (req: Request, res: Response) => {
     try {
          const companies = await prisma.company.findMany({
               select: {
                    ...companySelect,
                    _count: {
                         select: {
                              positions: {
                                   where: { deletedAt: null }
                              }
                         }
                    }
               }
          })
          res.json(companies);
     } catch (error) {
          res.status(500).json({ message: "Hiba a cégek lekérésekor." });
     }
}

export const getCompanyById = async (req: Request, res: Response) => {
     const id = req.params.id;
     try {
          const company = await prisma.company.findUnique({
               where: { id },
               select: {
                    ...companySelect,
                    positions: {
                         where: {
                              isActive: true,
                              deletedAt: null
                         },
                         select: positionSelect
                    },
                    employees: {
                         where: {
                              deletedAt: null
                         },
                         select: {
                              id: true,
                              jobTitle: true,
                              user: {
                                   select: {
                                        fullName: true,
                                        email: true
                                   }
                              }
                         }
                    }
               }
          })

          if (!company) return res.status(404).json({ message: "Cég nem található." });

          await logAction(req, {
               action: "VIEW_COMPANY",
               entity: "Company",
               entityId: id,
               details: { viewById: req.user?.userId, name: company.name }
          });

          res.json(company);
     } catch (error) {
          res.status(500).json({ message: "Hiba a cég lekérésekor." });
     }
}

export const createCompany = async (
     req: Request<{}, {}, CompanyInput>,
     res: Response
) => {
     const data = req.body;
     try {
          const existingCompany = await prisma.company.findUnique({
               where: { taxId: data.taxId },
          });

          if (existingCompany) {
               return res
                    .status(400)
                    .json({ message: "Már létezik cég a megadott adószámmal." });
          }

          const newCompany = await prisma.company.create({
               data: {
                    ...data,
                    hqZipCode: String(data.hqZipCode),
                    hqCity: data.hqCity || "",
                    hqAddress: data.hqAddress || "",
                    hqCountry: data.hqCountry || "Magyarország"
               },
               select: companySelect
          });

          await logAction(req, {
               action: "CREATE_COMPANY",
               entity: "Company",
               entityId: newCompany.id,
               details: { createdById: req.user?.userId, name: newCompany.name, taxId: newCompany.taxId }
          });

          res
               .status(201)
               .json({ message: "Sikeres cég létrehozás", company: newCompany });
     } catch (error) {
          console.error("Company Creation Error:", error);
          return res
               .status(500)
               .json({ message: "Hiba történt a cég létrehozásakor." });
     }
};

export const updateCompany = async (req: Request, res: Response) => {
     const { companyId } = req.params;
     const data = req.body;

     if (data.hqZipCode) {
          data.hqZipCode = String(data.hqZipCode);
     }

     try {
          const updatedCompany = await prisma.company.update({
               where: { id: companyId },
               data: data,
               select: companySelect
          });

          await logAction(req, {
               action: "UPDATE_COMPANY",
               entity: "Company",
               entityId: companyId,
               details: { updatedById: req.user?.userId, updatedFields: Object.keys(data) }
          });

          return res.json({ message: "Cég adatai frissítve", company: updatedCompany });
     } catch (error) {
          // Fontos: Logold a konkrét hibát a Railway konzolra!
          console.error("Prisma Update Error:", error);
          return res.status(500).json({ message: "Hiba a cég frissítésekor. Ellenőrizd az adatokat!" });
     }
}

export const deleteCompany = async (req: Request, res: Response) => {
     const { id } = req.params;
     try {
          await prisma.company.update({
               where: { id },
               data: { isActive: false, deletedAt: new Date() }
          })
          await prisma.position.updateMany({
               where: { companyId: id },
               data: { isActive: false, deletedAt: new Date() }
          });
          await prisma.companyEmployee.updateMany({
               where: { companyId: id },
               data: { deletedAt: new Date() }
          });
          const employees = await prisma.companyEmployee.findMany({
               where: { companyId: id },
               select: { userId: true }
          });

          const employeeUserIds = employees.map(e => e.userId);

          if (employeeUserIds.length > 0) {
               await prisma.user.updateMany({
                    where: { id: { in: employeeUserIds } },
                    data: { deletedAt: new Date() }
               });
          }

          await logAction(req, {
               action: "DELETE_COMPANY",
               entity: "Company",
               entityId: id,
               details: { name: id, deletedById: req.user?.userId }
          });

          return res.json({ message: "Cég és kapcsolódó pozíciói törölve." });
     } catch (error) {
          return res.status(500).json({ message: "Hiba a cég törlésekor." });
     }
}

export const getInactiveCompanies = async (req: Request, res: Response) => {
     try {
          const inactiveCompanies = await prisma.company.findMany({
               where: {
                    isActive: false,
                    deletedAt: null
               },
               select: companySelect,
               orderBy: { name: "asc" }
          });

          return res.json(inactiveCompanies);
     } catch (error) {
          return res.status(500).json({ message: "Hiba az inaktív cégek lekérésekor." });
     }
};

export const reactivateCompany = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {
          const company = await prisma.company.findFirst({
               where: { id, isActive: false, deletedAt: null }
          });

          if (!company) {
               return res.status(404).json({ message: "Nem található inaktív (de nem törölt) cég ezzel az ID-val." });
          }

          const updatedCompany = await prisma.company.update({
               where: { id },
               data: { isActive: true },
               select: companySelect
          });

          await logAction(req, {
               action: "REACTIVATE_COMPANY",
               entity: "Company",
               entityId: id,
               details: {
                    reactivatedBy: req.user?.userId
               }
          });

          return res.json({ message: "Cég sikeresen újraaktiválva.", company: updatedCompany });
     } catch (error) {
          return res.status(500).json({ message: "Hiba a cég újraaktiválásakor." });
     }
};

export const deactivateCompany = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {
          const company = await prisma.company.findFirst({
               where: { id, deletedAt: null }
          });

          if (!company) {
               return res.status(404).json({ message: "Nem található aktív cég ezzel az ID-val." });
          }

          const updatedCompany = await prisma.company.update({
               where: { id },
               data: { isActive: false },
               select: companySelect
          });

          await logAction(req, {
               action: "DEACTIVATE_COMPANY",
               entity: "Company",
               entityId: id,
               details: {
                    deactivatedBy: req.user?.userId
               }
          });

          return res.json({ message: "Cég sikeresen deaktiválva.", company: updatedCompany });
     } catch (error) {
          return res.status(500).json({ message: "Hiba a cég deaktiválásakor." });
     }
};
