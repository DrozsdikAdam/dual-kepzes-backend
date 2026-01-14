import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";

const companySelect = {
     id: true,
     name: true,
     taxId: true,
     contactName: true,
     contactEmail: true,
     isActive: true,
     deletedAt: true
};

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
