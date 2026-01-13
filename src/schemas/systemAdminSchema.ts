import { z } from "zod"

export const systemAdminUpdateSchema = z.object({
     params: z.object({
          id: z.string().uuid("Érvénytelen rendszeradmin azonosító")
     }),
     body: z.object({
          fullName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).optional(),
          phoneNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, { message: "Érvénytelen telefonszám formátum" }).optional(),
          isActive: z.boolean().optional(),
     }).strict()
})