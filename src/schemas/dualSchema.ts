
import { z } from 'zod';

const dualPartnershipBody = z.object({
  studentId: z.string().uuid(),
  mentorId: z.string().uuid().optional(),
  uniEmployeeId: z.string().uuid().optional(),
  semester: z.string(),
  contractNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'FINISHED', 'TERMINATED']).default('ACTIVE'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const DualPartnershipUpdateSchema = z.object({
  body: dualPartnershipBody.partial(),
  params: z.object({
    id: z.string().uuid(),
  })
});
