import { z } from 'zod';

/**
 * Schema for validating user signup data.
 */
export const signupSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,32}$/),
  email: z
    .string()
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    .max(320),
  password: z.string().min(8).max(256),
  display_name: z.string().min(1).max(100),
});