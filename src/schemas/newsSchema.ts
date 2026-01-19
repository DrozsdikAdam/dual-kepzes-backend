import { z } from "zod";

export const CreateNewsSchema = z.object({
     body: z.object({
          title: z.string().min(1).max(100),
          content: z.string().min(1).max(500),
          isImportant: z.boolean().default(false),
          targetGroup: z.enum(["STUDENT", "ALL"]),
          tags: z.array(z.string()).optional()
     })
})
