import { z } from 'zod';

const dualPartnershipBody = z.object({
  studentId: z.string().uuid(),
  mentorId: z.string().uuid().optional(),
  uniEmployeeId: z.string().uuid().optional(),
  semester: z.string(),
  contractNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'FINISHED', 'TERMINATED', 'PENDING_MENTOR', 'PENDING_UNIVERSITY']).default('PENDING_MENTOR'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  positionId: z.string().uuid().optional(),
});

export const DualPartnershipUpdateSchema = z.object({
  body: dualPartnershipBody.partial(),
  params: z.object({
    id: z.string().uuid(),
  })
});

export const AssignMentorSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    mentorId: z.string().uuid()
  })
});

export const AssignUniversityUserSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    uniEmployeeId: z.string().uuid()
  })
});

export type DualPartnershipUpdateRequest = z.infer<typeof DualPartnershipUpdateSchema>;
export type AssignMentorRequest = z.infer<typeof AssignMentorSchema>;
export type AssignUniversityUserRequest = z.infer<typeof AssignUniversityUserSchema>;
