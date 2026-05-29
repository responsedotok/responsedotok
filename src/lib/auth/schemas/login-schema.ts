import { z } from 'zod';

/**
 * Schema for validating user login data.
 */
export const loginSchema = z.object({
  identifier: z.string().min(3).max(320),
  password: z.string().min(1).max(256),
});
