
import type { Session } from '@/lib/types/session';
import { generateToken } from '@/lib/auth/tokens/generate-token';
import { hashToken } from '@/lib/auth/tokens/hash-token';
import { sql } from '@/db/pool';

/**
 * Creates a new session for the specified user.
 * @param userId The ID of the user for whom to create the session.
 * @returns The created session object containing the token and expiration date.
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateToken();
  const id = hashToken(token);
  const expiresAt = new Date(
    Date.now() + Number(process.env.SESSION_LIFETIME_MS),
  );

  await sql`
    INSERT INTO session (id, user_id, expires_at)
    VALUES (${id}, ${userId}, ${expiresAt})
  `;

  return { token, expiresAt };
}
