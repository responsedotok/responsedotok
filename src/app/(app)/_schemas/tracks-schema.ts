import { z } from 'zod';

export const trackSchema = z.object({
  blob_url: z.string().url().max(1000),
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  size_bytes: z.number().int().positive(),
});
