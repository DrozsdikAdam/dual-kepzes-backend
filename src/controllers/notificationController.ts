import { Request, Response } from "express";
import prisma from "../config/prisma";

const notificationSelection = {
     id: true,
     title: true,
     message: true,
     type: true,
     isRead: true,
     isArchived: true,
     sentAt: true,
}

export const getNotifications = async (req: Request, res: Response) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notifications = await prisma.notification.findMany({
               where: { userId: userId, isArchived: false },
               orderBy: { createdAt: "desc" },
               select: notificationSelection
          })

          return res.status(200).json(notifications)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítések lekérésekor." })
     }
}

export const getNotificationById = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId;

          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notification = await prisma.notification.findFirst({
               where: { id: id, userId: userId },
               select: notificationSelection
          })

          if (!notification) {
               return res.status(404).json({ message: "Nem található értesítés." })
          }

          return res.status(200).json(notification)

     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítés lekérésekor." })
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
               data: { isRead: true },
               select: notificationSelection
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
               data: { isRead: true },
          })

          return res.status(200).json({ message: "Az összes értesítés olvasottnak jelölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az összes értesítés olvasottnak jelölésekor." })
     }
}

export const deleteNotification = async (req: Request, res: Response) => {
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
               data: { isArchived: true, deletedAt: new Date() },
               select: notificationSelection
          })

          return res.status(200).json({ message: "Értesítés törölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítás törlésekor." })
     }
}

export const archiveNotification = async (req: Request, res: Response) => {
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
               data: { isArchived: true },
               select: notificationSelection
          })

          return res.status(200).json({ message: "Értesítés archiválva." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az archibált értesítések lekérésekor." })
     }
}

export const getArchivedNotifications = async (req: Request, res: Response) => {
     try {
          const userId = req.user?.userId;
          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notifications = await prisma.notification.findMany({
               where: { userId: userId, isArchived: true },
               orderBy: { createdAt: "desc" },
               select: notificationSelection
          })

          return res.status(200).json(notifications)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az archivált értesítések lekérdezésekor." })
     }
}

export const unarchiveNotification = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          const userId = req.user?.userId

          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const notification = await prisma.notification.findFirst({
               where: { id },
               select: { id: true }
          })

          if (!notification) {
               return res.status(404).json({ message: "Nem létező értesítés." })
          }

          await prisma.notification.update({
               where: { id: id, userId: userId },
               data: { isArchived: false },
               select: notificationSelection
          })

          return res.status(200).json({ message: "Értesítés visszaállítva." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba az archivált értesítés visszaállításakor." })
     }
}

export const createNotification = async (req: Request, res: Response) => {
     try {
          const userId = req.user?.userId

          if (!userId) {
               return res.status(401).json({ message: "Nincs jogosultságod." })
          }

          const { title, message, type, link } = req.body

          if (!title || !message || !type) {
               return res.status(400).json({ message: "Hiányzó adatok." })
          }

          const notification = await prisma.notification.create({
               data: {
                    userId: userId,
                    title: title,
                    message: message,
                    type: type,
               },
               select: notificationSelection
          })

          return res.status(201).json(notification)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az értesítés létrehozásakor." })
     }
}