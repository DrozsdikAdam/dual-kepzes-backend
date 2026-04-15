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

export const AssignMajorsSchema = z.object({
     params: z.object({
          id: z.string().uuid()
     }),
     body: z.object({
          majorIds: z.array(z.string().uuid())
     })
})

export const AssignCompaniesSchema = z.object({
     params: z.object({
          id: z.string().uuid()
     }),
     body: z.object({
          companyIds: z.array(z.string().uuid())
     })
})

export const PotentialReferentsQuerySchema = z.object({
     query: z.object({
          studentId: z.string().uuid("Érvénytelen hallgató azonosító"),
          positionId: z.string().uuid("Érvénytelen pozíció azonosító")
     })
});

export type UniversityUserUpdateInput = z.infer<typeof UniversityUserUpdateSchema>["body"];
export type AssignMajorsInput = z.infer<typeof AssignMajorsSchema>["body"];
export type AssignCompaniesInput = z.infer<typeof AssignCompaniesSchema>["body"];
export type PotentialReferentsQuery = z.infer<typeof PotentialReferentsQuerySchema>["query"];