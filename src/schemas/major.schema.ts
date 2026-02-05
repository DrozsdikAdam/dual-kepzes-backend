import { z } from "zod";

export const CreateMajorSchema = z.object({
     body: z.object({
          name: z.string().trim().min(1, "A szak neve kötelező"),
          language: z.string().trim().min(1, "A nyelv megadása kötelező")
     })
});

export const UpdateMajorSchema = z.object({
     params: z.object({
          id: z.string().uuid("Érvénytelen szak azonosító")
     }),
     body: z.object({
          name: z.string().trim().min(1).optional(),
          language: z.string().trim().min(1).optional()
     })
});

export const MajorIdParamSchema = z.object({
     params: z.object({
          id: z.string().uuid("Érvénytelen szak azonosító")
     })
});

export type CreateMajorInput = z.infer<typeof CreateMajorSchema>["body"];
export type UpdateMajorInput = z.infer<typeof UpdateMajorSchema>["body"];
