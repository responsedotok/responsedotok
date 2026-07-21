import { z } from 'zod';

/**
 * Validates the fields for creating a project (song). The lean v1 UI only
 * offers 'private' and 'public'; 'collective' exists in the DB enum but is
 * not selectable yet.
 */
export const songSchema = z.object({
  title: z.string().trim().min(1).max(200),
  genre: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  visibility: z.enum(['private', 'public']),
});
