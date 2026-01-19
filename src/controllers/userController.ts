import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logAction } from "../utils/logger";

const userSelect = {
     id: true,
     email: true,
     fullName: true,
     phoneNumber: true,
     role: true,
     isActive: true,
     deletedAt: true
};

export const getInactiveUsers = async (req: Request, res: Response) => {
     try {
          const inactiveUsers = await prisma.user.findMany({
               where: {
                    isActive: false,
                    deletedAt: null
               },
               select: userSelect,
               orderBy: { fullName: "asc" }
          });

          return res.json(inactiveUsers);
     } catch (error) {
          return res.status(500).json({ message: "Hiba az inaktív felhasználók lekérésekor." });
     }
};

export const reactivateUser = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {
          const user = await prisma.user.findFirst({
               where: { id, isActive: false, deletedAt: null }
          });

          if (!user) {
               return res.status(404).json({ message: "Nem található inaktív felhasználó ezzel az ID-val." });
          }

          const updatedUser = await prisma.user.update({
               where: { id },
               data: { isActive: true },
               select: userSelect
          });

          await logAction(req, {
               action: "REACTIVATE_USER",
               entity: "User",
               entityId: id,
               details: {
                    reactivatedBy: req.user?.userId
               }
          });

          return res.json({ message: "Felhasználó sikeresen újraaktiválva.", user: updatedUser });
     } catch (error) {
          return res.status(500).json({ message: "Hiba a felhasználó újraaktiválásakor." });
     }
};

export const deactivateUser = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {
          const user = await prisma.user.findFirst({
               where: { id, deletedAt: null }
          });

          if (!user) {
               return res.status(404).json({ message: "Nem található aktív felhasználó ezzel az ID-val." });
          }

          const updatedUser = await prisma.user.update({
               where: { id },
               data: { isActive: false },
               select: userSelect
          });

          await logAction(req, {
               action: "DEACTIVATE_USER",
               entity: "User",
               entityId: id,
               details: {
                    deactivatedBy: req.user?.userId
               }
          });

          return res.json({ message: "Felhasználó sikeresen deaktiválva.", user: updatedUser });
     } catch (error) {
          return res.status(500).json({ message: "Hiba a felhasználó deaktiválásakor." });
     }
};
