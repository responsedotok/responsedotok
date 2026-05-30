import { z } from 'zod';
import { trackSchema } from '@/app/(app)/presskit/tracks-schema';

export const presskitSchema = z.object({
  artist_name: z.string().trim().min(1).max(100),
  recipient_name: z.string().trim().min(1).max(100),
  recipient_org: z.string().trim().max(100).optional().nullable(),
  greeting: z.string().trim().min(1).max(200),
  pitch: z.string().trim().min(1).max(2000),
  tracks: z.array(trackSchema).min(1).max(2),
});
