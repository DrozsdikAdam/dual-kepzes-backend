import { Request, Response } from "express"
import prisma from "../config/prisma"
import { Role } from "@prisma/client"

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

export const getMeCompanyAdmin = async (req: Request, res: Response) => {
     const userId = req.user?.userId

     if (!userId) {
          return res.status(401).json({ message: "Nincs azonosított felhasználó." })
     }

     try {
          const user = await prisma.user.findFirst({
               where: {
                    id: userId,
                    role: Role.COMPANY_ADMIN
               },
               select: companyAdminSelect
          })

          if (!user) {
               return res.status(404).json({ message: "Nem található a cégadmin profil." })
          }

          return res.json(user)

     } catch (error) {
          return res.status(500).json({ message: "Hiba az adatok lekérésekor." })
     }
}

export const getCompanyAdmins = async (req: Request, res: Response) => {
     try {
          const admins = await prisma.user.findMany({
               where: { role: Role.COMPANY_ADMIN },
               select: companyAdminSelect,
               orderBy: { fullName: "asc" }
          })
          return res.json(admins)
     } catch (error) {
          return res.status(500).json({ message: "Hiba az adminok lekérésekor." })
     }
}

export const getCompanyAdminById = async (req: Request, res: Response) => {
     const { id } = req.params

     try {
          const admin = await prisma.user.findFirst({
               where: {
                    id,
                    role: Role.COMPANY_ADMIN
               },
               select: companyAdminSelect
          })

          if (!admin) {
               return res.status(404).json({ message: "A céges adminisztrátor nem található." })
          }

          return res.json(admin)
     } catch (error) {
          return res.status(500).json({ message: "Hiba a lekérdezés során." })
     }
}

export const updateCompanyAdminById = async (req: Request, res: Response) => {
     const { id } = req.params
     const { fullName, phoneNumber, isActive, jobTitle } = req.body

     try {
          const target = await prisma.user.findFirst({
               where: {
                    id,
                    role: Role.COMPANY_ADMIN
               },
               include: {
                    companyEmployee: true
               }
          })

          if (!target) {
               return res.status(404).json({ message: "Nem található a profil." })
          }

          // Transaction to update both User and CompanyEmployee if needed
          const updated = await prisma.$transaction(async (tx) => {
               // Update User fields
               await tx.user.update({
                    where: { id },
                    data: {
                         fullName,
                         phoneNumber,
                         isActive
                    }
               })

               // Update CompanyEmployee fields if jobTitle is provided and employee record exists
               if (jobTitle !== undefined && target.companyEmployee) {
                    await tx.companyEmployee.update({
                         where: { id: target.companyEmployee.id },
                         data: {
                              jobTitle
                         }
                    })
               }

               // Return the fresh data
               return tx.user.findUnique({
                    where: { id },
                    select: companyAdminSelect
               })
          })

          return res.json({ message: "Cégadmin adatai sikeresen frissítve.", updated })
     } catch (error) {
          console.error(error)
          return res.status(500).json({ message: "Hiba történt a frissítéskor." })
     }
}

export const deleteCompanyAdmin = async (req: Request, res: Response) => {
     const { id } = req.params

     try {
          // Soft delete
          await prisma.$transaction(async (tx) => {
               const user = await tx.user.update({
                    where: { id },
                    data: {
                         isActive: false,
                         deletedAt: new Date()
                    },
                    include: { companyEmployee: true }
               })

               if (user.companyEmployee) {
                    await tx.companyEmployee.update({
                         where: { id: user.companyEmployee.id },
                         data: {
                              deletedAt: new Date()
                         }
                    })
               }
          })

          return res.json({ message: "A rekord sikeresen törölve." })
     } catch (error) {
          return res.status(500).json({ message: "Hiba történt a törlés során." })
     }
}
