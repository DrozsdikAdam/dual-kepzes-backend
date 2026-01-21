import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getNotifications = async (req: Request, res: Response) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notifications = await prisma.notification.findMany({
               where: { userId: userId },
               orderBy: { createdAt: "desc" }
          })

          return res.status(200).json(notifications)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítések lekérésekor." })
     }
}

export const markAsRead = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;

          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notification = await prisma.notification.findFirst({
               where: { id: id, userId: userId }
          })

          if (!notification) {
               return res.status(404).json({ message: "Nem található értesítés." })
          }

          await prisma.notification.update({
               where: { id: id, userId: userId },
               data: { isRead: true }
          })

          return res.status(200).json({ message: "Értesítés olvasottnak jelölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítés olvasottnak jelölésekor." })
     }
}

export const markAllAsRead = async (req: Request, res: Response) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          await prisma.notification.updateMany({
               where: { userId: userId },
               data: { isRead: true }
          })

          return res.status(200).json({ message: "Az összes értesítés olvasottnak jelölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az összes értesítés olvasottnak jelölésekor." })
     }
}

