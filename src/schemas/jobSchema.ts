import { z } from 'zod'

export const companySchema = z.object({
    name: z.string().min(1, 'A név megadása kötelező').max(100, 'A név maximum 100 karakter lehet'),
    taxId: z.string().min(1, 'Az adószám megadása kötelező').max(20, 'Az adószám maximum 20 karakter lehet'),
    hqCountry: z.string().trim().min(1).optional(),
    hqZipCode: z.coerce.number().min(1000).max(9999).optional(),
    hqCity: z.string().trim().min(1).optional(),
    hqAddress: z.string().trim().includes(" ").optional(),
    contactName:  z.string().trim().includes(" ", { message: "Az név legalább egy szóközt tartalmaz" }).min(1),
    contactEmail: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
    logoUrl: z.string().trim().url('Érvénytelen logó URL').optional(),
    website: z.string().trim().url('Érvénytelen weboldal URL').optional(),
})

export const PositionSchema = z.object({
    companyId: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    zipCode: z.string(),
    city: z.string(),
    address: z.string(),
    deadline: z.coerce.date().optional().nullable(),
})
