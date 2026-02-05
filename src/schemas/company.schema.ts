import { z } from "zod";
import { CompanyCreateSchema } from "./job.schema";
import { companyAdminSchema } from "./auth.schema";

export const CompanyWithAdminCreateSchema = z.object({
     body: z.object({
          company: CompanyCreateSchema.shape.body,
          admin: companyAdminSchema.omit({ role: true, companyId: true })
     })
});

export type CompanyWithAdminInput = z.infer<typeof CompanyWithAdminCreateSchema>["body"];
