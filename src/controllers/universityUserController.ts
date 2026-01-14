import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Role } from "@prisma/client";
import { logAction } from "../utils/logger";

const universityUserSelect = {
     id: true,
     email: true,
     fullName: true,
     phoneNumber: true,
     role: true,
     isActive: true,
     createdAt: true
};

export const getUniversityUsers = async (req: Request, res: Response) => {
     try {
          const users = await prisma.user.findMany({
               where: {
                    role: Role.UNIVERSITY_USER
               },
               select: universityUserSelect,
               orderBy: { fullName: "asc" }
          });

          await logAction(req, {
               action: "LIST_UNIVERSITY_USERS",
               entity: "User",
               details: { listById: req.user?.userId, count: users.length }
          });
          return res.json(users);
     } catch (error) {
          return res.status(500).json({ message: "Hiba az egyetemi dolgozók lekérésekor." });
     }
};

export const getUniversityUserById = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {
          const user = await prisma.user.findFirst({
               where: {
                    id: id,
                    role: Role.UNIVERSITY_USER
               },
               select: universityUserSelect
          });

          if (!user) {
               return res.status(404).json({ message: "A keresett dolgozó nem található." });
          }


          await logAction(req, {
               action: "VIEW_UNIVERSITY_USER_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedById: req.user?.userId }
          })

          return res.json(user);
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a lekérdezés közben." });
     }
};

export const updateUniversityUserById = async (req: Request, res: Response) => {
     const { id } = req.params;
     const { fullName, phoneNumber, isActive } = req.body;
     const currentUser = req.user!;

     try {
          const target = await prisma.user.findFirst({
               where: { id: id, role: Role.UNIVERSITY_USER }
          });

          if (!target) {
               return res.status(404).json({ message: "A keresett dolgozó nem található." });
          }

          const isSelf = id === currentUser.userId;
          const isSystemAdmin = currentUser.role === Role.SYSTEM_ADMIN;

          if (!isSelf && !isSystemAdmin) {
               return res.status(403).json({ message: "Nincs jogosultságod a művelet elvégzéséhez." });
          }

          const updatedUser = await prisma.user.update({
               where: { id },
               data: {
                    fullName,
                    phoneNumber,
                    isActive: isSystemAdmin ? isActive : undefined
               },
               select: universityUserSelect
          });

          await logAction(req, {
               action: "UPDATE_UNIVERSITY_USER",
               entity: "User",
               entityId: id,
               details: {
                    updatedBy: currentUser.userId,
                    fields: { fullName, phoneNumber, isActive: isSystemAdmin ? isActive : 'unchanged' }
               }
          });

          return res.json({ message: "Adatok sikeresen frissítve.", user: updatedUser });

     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a frissítés során." });
     }
};

export const deleteUniversityUser = async (req: Request, res: Response) => {
     const { id } = req.params;

     try {

          await prisma.user.update({
               where: { id },
               data: {
                    isActive: false,
                    deletedAt: new Date()
               }
          });

          await logAction(req, {
               action: "DELETE_UNIVERSITY_USER",
               entity: "User",
               entityId: id,
               details: { deletedById: req.user?.userId }
          });

          return res.json({ message: "A rekord sikeresen törölve." });
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a törlés során." });
     }

};
