import { z } from 'zod';

export const UpdateEmployeeSchema = z.object({
    body: z.object({
        fullName: z.string().trim().includes(" ").min(1).optional(),
        phoneNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
        jobTitle: z.string().trim().min(1).optional(),
        isActive: z.boolean().optional()
    })
});

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>['body'];