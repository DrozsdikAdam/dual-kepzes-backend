import { Request, Response } from "express"
import prisma from "../config/prisma"
import { PartnershipStatus, Role } from "@prisma/client"
import { logAction } from "../utils/logger"

// 1. Központi SELECT definíció
const companyAdminSelect = {
     id: true,
     email: true,
     fullName: true,
     phoneNumber: true,
     role: true,
     isActive: true,
     companyEmployee: {
          select: {
               id: true,
               jobTitle: true,
               company: {
                    select: {
                         id: true,
                         name: true
                    }
               }
          }
     }
}


// Saját profil lekérése
export const getMeCompanyAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId
     if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." })

     try {
          const user = await prisma.user.findUnique({
               where: { id: userId },
               select: companyAdminSelect
          })

          if (!user || user.role !== Role.COMPANY_ADMIN) {
               return res.status(404).json({ message: "Nem található a cégadmin profil." })
          }

          return res.json(user) // return használata kötelező!
     } catch (error) {
          return res.status(500).json({ message: "Hiba az adatok lekérésekor." })
     }
}

export const updateMeCompanyAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId
     const { fullName, phoneNumber, jobTitle } = req.body

     if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." })

     try {
          const target = await prisma.user.findUnique({ where: { id: userId } })
          if (!target || target.role !== Role.COMPANY_ADMIN) {
               return res.status(404).json({ message: "Nem található a profil." })
          }

          const updated = await prisma.$transaction(async (tx) => {
               await tx.user.update({
                    where: { id: userId },
                    data: {
                         fullName,
                         phoneNumber
                    }
               })

               if (jobTitle !== undefined) {
                    await tx.companyEmployee.update({
                         where: { userId: userId },
                         data: { jobTitle }
                    })
               }

               return tx.user.findUnique({
                    where: { id: userId },
                    select: companyAdminSelect
               })
          })

          await logAction(req, {
               action: "UPDATE_MY_PROFILE",
               entity: "User",
               entityId: userId,
               details: { changes: { fullName, jobTitle } }
          })

          return res.json({ message: "Saját adatok frissítve.", user: updated })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a frissítés során." })
     }
}

export const deleteMeCompanyAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId
     if (!userId) return res.status(401).json({ message: "Nincs azonosított felhasználó." })

     try {
          await prisma.$transaction(async (tx) => {
               await tx.user.update({
                    where: { id: userId },
                    data: { isActive: false, deletedAt: new Date() }
               })
               await tx.companyEmployee.update({
                    where: { userId: userId },
                    data: { deletedAt: new Date() }
               })
          })

          await logAction(req, {
               action: "DELETE_MY_PROFILE",
               entity: "User",
               entityId: userId
          })
          return res.json({ message: "A profil sikeresen törölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a törlés során." })
     }
}


// Összes cégadmin listázása (pl. System Admin számára)
export const getCompanyAdmins = async (req: Request, res: Response) => {
     try {
          const admins = await prisma.user.findMany({
               where: { role: Role.COMPANY_ADMIN },
               select: companyAdminSelect,
               orderBy: { fullName: "asc" }
          })

          await logAction(req, {
               action: "LIST_COMPANY_ADMINS",
               entity: "User",
               details: { count: admins.length }
          })
          return res.json(admins)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az adminok lekérésekor." })
     }
}

// Egyedi cégadmin lekérése ID alapján
export const getCompanyAdminById = async (req: Request, res: Response) => {
     const { id } = req.params
     try {
          const admin = await prisma.user.findUnique({
               where: { id },
               select: companyAdminSelect
          })

          // Ellenőrizzük, hogy létezik és valóban cégadmin-e
          if (!admin || admin.role !== Role.COMPANY_ADMIN) {
               return res.status(404).json({ message: "A céges adminisztrátor nem található." })
          }

          await logAction(req, {
               action: "VIEW_ADMIN_DETAILS",
               entity: "User",
               entityId: id,
               details: { viewedEmail: admin.email }
          })
          return res.json(admin)
     } catch (error) {
          return res.status(500).json({ message: "Hiba a lekérdezés során." })
     }
}

// Cégadmin frissítése
export const updateCompanyAdminById = async (req: Request, res: Response) => {
     const { id } = req.params
     const { fullName, phoneNumber, isActive, jobTitle } = req.body
     const currentUser = req.user!

     try {
          // 1. Ellenőrizzük, hogy létezik-e a célpont
          const target = await prisma.user.findUnique({ where: { id } })
          if (!target || target.role !== Role.COMPANY_ADMIN) {
               return res.status(404).json({ message: "Nem található a profil." })
          }

          // 2. Jogosultság: Saját magát vagy System Admin
          const isSystemAdmin = currentUser.role === Role.SYSTEM_ADMIN;
          const isSelf = id === currentUser.userId;

          if (!isSelf && !isSystemAdmin) {
               return res.status(403).json({ message: "Nincs jogosultságod a módosításhoz." })
          }

          // 3. Tranzakciós frissítés
          const updated = await prisma.$transaction(async (tx) => {
               await tx.user.update({
                    where: { id },
                    data: {
                         fullName,
                         phoneNumber,
                         isActive: isSystemAdmin ? isActive : undefined
                    }
               })

               if (jobTitle !== undefined) {
                    await tx.companyEmployee.update({
                         where: { userId: id },
                         data: { jobTitle }
                    })
               }

               return tx.user.findUnique({
                    where: { id },
                    select: companyAdminSelect
               })
          })

          await logAction(req, {
               action: "UPDATE_COMPANY_ADMIN",
               entity: "User",
               entityId: id,
               details: { changes: { fullName, jobTitle } }
          })

          return res.json({ message: "Cégadmin adatok frissítve.", user: updated })
     } catch (error) {
          return res.status(500).json({ message: "Hiba a frissítés során." })
     }
}

// Cégadmin törlése (Soft Delete)
export const deleteCompanyAdmin = async (req: Request, res: Response) => {
     const { id } = req.params
     try {
          // 1. Ellenőrzés
          const target = await prisma.user.findFirst({
               where: { id: id, role: Role.COMPANY_ADMIN }
          })

          if (!target) {
               return res.status(404).json({ message: "Nem található a cégadminisztrátor." })
          }

          // Tranzakcióban töröljük a felhasználót és a kapcsolódó munkavállalói profilt is
          await prisma.$transaction(async (tx) => {
               await tx.user.update({
                    where: { id },
                    data: { isActive: false, deletedAt: new Date() }
               })
               await tx.companyEmployee.update({
                    where: { userId: id },
                    data: { deletedAt: new Date() }
               })
          })

          await logAction(req, {
               action: "DELETE_COMPANY_ADMIN",
               entity: "User",
               entityId: id
          })
          return res.json({ message: "A rekord sikeresen törölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a törlés során." })
     }
}

export const restoreCompanyAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId
     const { id } = req.params

     if (!userId) {
          return res.status(401).json({ message: "Nincs jogosultságod." })
     }
     try {

          const target = await prisma.user.findUnique({ where: { id } })
          if (!target || target.role !== Role.COMPANY_ADMIN) {
               return res.status(404).json({ message: "Nem található cégadminisztrátor." })
          }

          const updated = await prisma.user.update({
               where: { id },
               data: { isActive: true, deletedAt: null },
               select: companyAdminSelect
          })

          return res.json(updated)
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a visszaállítása során." })
     }
}
