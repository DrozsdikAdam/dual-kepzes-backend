import { z } from "zod";

export const CompanyCreateSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, "A név megadása kötelező")
            .max(100, "A név maximum 100 karakter lehet"),
        taxId: z
            .string()
            .min(1, "Az adószám megadása kötelező")
            .max(20, "Az adószám maximum 20 karakter lehet"),
        // Módosítva: locations tömb támogatása location objektum helyett
        locations: z.array(z.object({
            id: z.string().uuid().optional(), // Opcionális ID frissítéshez
            country: z.string().trim().min(1).optional(),
            zipCode: z.coerce.number().min(1000).max(9999).optional(),
            city: z.string().trim().min(1).optional(),
            address: z.string().trim().includes(" ").optional(),
        })).optional().default([]),
        contactName: z
            .string()
            .trim()
            .includes(" ", { message: "A név legalább egy szóközt tartalmaz" })
            .min(1),
        contactEmail: z
            .string()
            .trim()
            .email({ message: "Érvénytelen email cím formátum" }),
        description: z.string().optional(),
        logoUrl: z.string().trim().url("Érvénytelen logó URL").optional(),
        website: z.string().trim().url("Érvénytelen weboldal URL").optional().nullable(),
        hasOwnApplication: z.boolean().default(false),
    }).refine((data) => {
        if (data.hasOwnApplication && !data.website) {
            return false;
        }
        return true;
    }, {
        message: "A weboldal megadása kötelező, ha a cég saját jelentkezési felülettel rendelkezik.",
        path: ["website"]
    }),
});

export const PositionCreateSchema = z.object({
    body: z.object({
        companyId: z.string().uuid(),
        title: z.string().min(3),
        description: z.string().optional(),
        locationId: z.string().uuid("Érvénytelen helyszín azonosító"),
        isDual: z.boolean().default(false),
        deadline: z.coerce.date().optional().nullable(),
        tags: z.array(
            z.object({
                name: z.string()
                    .trim()
                    .min(1)
                    .transform((val) => {
                        // Ugyanaz a normalizálás, mint eddig
                        const trimmed = val.replace(/\s+/g, " ");
                        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
                    }),
                category: z.string()
                    .trim()
                    .min(1)
                    .default("Technology") // Ha a kliens nem küldi, ez lesz az alapértelmezett
            })
        )
            .optional()
            .default([]),
    }),
});

export const TagCreateSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "A címke neve nem lehet üres."),
    }),
});

export const CompanyUpdateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen cég azonosító"),
    }),
    body: CompanyCreateSchema.shape.body.partial()
})

export const PositionUpdateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen pozíció azonosító"),
    }),
    body: PositionCreateSchema.shape.body.omit({ companyId: true }).partial()
})

export type CompanyInput = z.infer<typeof CompanyCreateSchema>["body"];
export type PositionInput = z.infer<typeof PositionCreateSchema>["body"];
export type TagInput = z.infer<typeof TagCreateSchema>["body"];
export type CompanyUpdateInput = z.infer<typeof CompanyUpdateSchema>["body"];
export type PositionUpdateInput = z.infer<typeof PositionUpdateSchema>["body"];
