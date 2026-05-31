import { sql } from '@/db/pool';
import { hashToken } from '@/lib/auth/tokens/hash-token';
import type { PublicUserRow } from '@/lib/types/public-user-row';

/**
 * Retrieves the user associated with the specified session token.
 * @param token The session token.
 * @returns The user object if found, otherwise null.
 */
export async function getUserBySession(
  token: string,
): Promise<PublicUserRow | null> {
  const [row] = await sql<PublicUserRow[]>`
    SELECT
      u.id, u.username, u.email, u.display_name,
      u.avatar_url, u.bio, u.created_at
    FROM session s
    JOIN "user" u ON u.id = s.user_id
    WHERE s.id = ${hashToken(token)}
      AND s.expires_at > NOW()
      AND u.deleted_at IS NULL
  `;
  return row ?? null;
}
