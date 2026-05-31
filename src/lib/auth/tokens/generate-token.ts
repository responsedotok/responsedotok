import { randomBytes } from 'node:crypto';

/**
 * Generates a random token.
 * @returns The generated token as a hexadecimal string.
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}
