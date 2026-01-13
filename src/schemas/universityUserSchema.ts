import { z } from "zod"

export const UniversityUserUpdateSchema = z.object({
     params: z.object({
          id: z.string().uuid()
     }),
     body: z.object({
          fullName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).optional(),
          phoneNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, { message: "Érvénytelen telefonszám formátum" }).optional(),
          isActive: z.boolean().optional(),
     }).strict()
})

export type UniversityUserUpdateInput = z.infer<typeof UniversityUserUpdateSchema>["body"];