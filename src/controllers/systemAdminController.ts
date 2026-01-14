import { Request, Response } from "express"
import prisma from "../config/prisma"
import { Role } from "@prisma/client"
import { logAction } from "../utils/logger"

const systemAdminSelect = {
     id: true,
     email: true,
     fullName: true,
     phoneNumber: true,
     role: true,
     isActive: true
}


export const getMeSystemAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId

     if (!userId) {
          return res.status(401).json({ message: "Nincs azonosított felhasználó." })
     }

     try {

          const user = await prisma.user.findFirst({
               where: {
                    id: userId
               },
               select: systemAdminSelect
          })

          if (!user) {
               return res.status(404).json({ message: "Nem található az admin profil." })
          }

          return res.json(user)

     } catch (error) {
          return res.status(500).json({ message: "Hiba az admin lekérésekor." })
     }
}


export const getSystemAdmins = async (req: Request, res: Response) => {
     try {
          const admins = await prisma.user.findMany({
               where: { role: Role.SYSTEM_ADMIN },
               select: systemAdminSelect,
               orderBy: { fullName: "asc" }
          })

          await logAction(req, {
               action: "LIST_SYSTEM_ADMINS",
               entity: "User",
               details: { listById: req.user?.userId, count: admins.length }
          })

          return res.json(admins)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az adminok lekérésekor." })
     }
}

export const getSystemAdminById = async (req: Request, res: Response) => {
     const { id } = req.params

     try {
          const admin = await prisma.user.findFirst({
               where: {
                    id,
                    role: Role.SYSTEM_ADMIN
               },
               select: systemAdminSelect
          })

          if (!admin) {
               return res.status(404).json({ message: "A rendszeradminisztrátor nem található." })
          }

          // EGYEDI ADMIN MEGTEKINTÉSÉNEK NAPLÓZÁSA
          await logAction(req, {
               action: "VIEW_SYSTEM_ADMIN_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedById: req.user?.userId, viewedEmail: admin.email }
          })

          return res.json(admin)
     } catch (error) {
          return res.status(500).json({ message: "Hiba a lekérdezés során." })
     }
}

export const updateSystemAdminById = async (req: Request, res: Response) => {
     const { id } = req.params
     const { fullName, phoneNumber, isActive } = req.body

     try {
          const target = await prisma.user.findFirst({
               where: {
                    id, role: Role.SYSTEM_ADMIN
               }
          })

          if (!target) {
               res.status(404).json({ message: "Nem található a profil." })
          }

          const updated = await prisma.user.update({
               where: { id },
               data: {
                    fullName,
                    phoneNumber,
                    isActive
               },
               select: systemAdminSelect
          })

          await logAction(req, {
               action: "UPDATE_SYSTEM_ADMIN",
               entity: "User",
               entityId: id,
               details: {
                    updatedBy: req.user?.userId,
                    changes: { fullName, phoneNumber, isActive }
               }
          })

          return res.json({ message: "Rendszeradmin adatai sikeresen frissítve.", updated })
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a frissítéskor." })
     }
}

export const deleteSystemAdmin = async (req: Request, res: Response) => {
     const { id } = req.params

     try {
          await prisma.user.update({
               where: { id },
               data: {
                    isActive: false,
                    deletedAt: new Date()
               }
          })

          await logAction(req, {
               action: "DELETE_SYSTEM_ADMIN",
               entity: "User",
               entityId: id,
               details: {
                    deletedBy: req.user?.userId,
               }
          })

          return res.json({ message: "A rekord sikeresen törölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a törlés során." })
     }
}