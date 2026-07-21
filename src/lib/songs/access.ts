import { sql } from '@/db/pool';
import type { SongAccess } from '@/lib/types/song-access';
import type { SongVisibility } from '@/lib/types/song-visibility';

type AccessRow = {
  owner_id: string;
  visibility: SongVisibility;
  role: SongAccess['role'];
};

/**
 * Resolves what a user (or a signed-out visitor, when userId is null) may do
 * with a song, in a single query. This is the one place the song
 * authorization rules live:
 *   - the owner can view and contribute
 *   - a 'contributor' collaborator can view and contribute
 *   - a 'viewer' collaborator can view only
 *   - anyone can view a 'public' song
 *
 * @param songId The song to check.
 * @param userId The requesting user's id, or null when signed out.
 * @returns The resolved access, or null if the song does not exist.
 */
export async function getSongAccess(
  songId: string,
  userId: string | null,
): Promise<SongAccess | null> {
  const [row] = await sql<AccessRow[]>`
    SELECT s.owner_id, s.visibility, c.role
    FROM song s
    LEFT JOIN song_collaborator c
      ON c.song_id = s.id AND c.user_id = ${userId}
    WHERE s.id = ${songId}
  `;
  if (!row) return null;

  const isOwner = userId !== null && row.owner_id === userId;
  const role = row.role ?? null;
  const canView =
    isOwner ||
    row.visibility === 'public' ||
    role === 'viewer' ||
    role === 'contributor';
  const canContribute = isOwner || role === 'contributor';

  return {
    songId,
    isOwner,
    role,
    visibility: row.visibility,
    canView,
    canContribute,
  };
}
