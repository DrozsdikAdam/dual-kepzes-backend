import { z } from "zod"

export const CreateApplicationSchema = z.object({
    body: z.object({
        positionId: z.string().uuid("Érvénytelen pozíció azonosító."),
        studentNote: z.string().trim().max(500, "A megjegyzés legfeljebb 500 karakter lehet.").optional()
    })
})

export const UpdateApplicationSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        status: z.enum(["SUBMITTED", "ACCEPTED", "REJECTED", "NO_RESPONSE"]),
        companyNote: z.string().trim().max(500).optional()
    })
})

export const EvaluateApplicationSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        status: z.enum(["ACCEPTED", "REJECTED", "NO_RESPONSE"]),
        companyNote: z.string().trim().max(500).optional()
    })
})