import { createHash, randomBytes } from 'node:crypto';

/**
 * Hashes the given token using SHA-256.
 * @param token The token to hash.
 * @returns The hashed token as a hexadecimal string.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
