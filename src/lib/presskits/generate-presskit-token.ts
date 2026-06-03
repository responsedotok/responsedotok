import { randomBytes } from 'node:crypto';

/**
 * Generates a new, unguessable, URL-safe token for a press-kit link.
 * @returns A 22-character base64url string.
 */
export function generatePresskitToken(): string {
  return randomBytes(16).toString('base64url');
}
