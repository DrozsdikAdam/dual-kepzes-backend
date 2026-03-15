import { z } from "zod";

export const CompleteMaterialSchema = z.object({
  body: z.object({
    materialId: z.string().min(1, "A tananyag azonosítója kötelező."),
    rating: z.number().int().min(1, "Az értékelés minimum 1 lehet.").max(5, "Az értékelés maximum 5 lehet.").optional(),
  }),
});
