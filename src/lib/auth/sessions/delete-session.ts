import { hashToken } from '@/lib/auth/tokens';
import { sql } from '@/db/pool';

/**
 * Deletes the session associated with the specified token.
 * @param token The session token to delete.
 */
export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM session WHERE id = ${hashToken(token)}`;
}