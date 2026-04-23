import { z } from "zod"

export const SystemAdminUpdateSchema = z.object({
     params: z.object({
          id: z.string().uuid("Érvénytelen rendszeradmin azonosító")
     }),
     body: z.object({
          fullName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).optional(),
          phoneNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, { message: "Érvénytelen telefonszám formátum" }).optional(),
          isActive: z.boolean().optional(),
     }).strict()
})

export const InviteEmailSchema = z.object({
     body: z.object({
          email: z.string().email("Érvénytelen email formátum"),
          subject: z.string().min(1, "A tárgy nem lehet üres"),
          body: z.string().min(1, "Az üzenet törzse nem lehet üres")
     })
});

export type InviteEmailInput = z.infer<typeof InviteEmailSchema>["body"];