import type { PublicUserRow } from '@/lib/types/public-user-row';
import type { PublicUser } from '../../types/public-user';

/**
 * Converts a PublicUserRow to a PublicUser.
 * @param row The PublicUserRow to convert.
 * @returns The corresponding PublicUser object.
 */
export function getPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    created_at: row.created_at.toISOString(),
  };
}
