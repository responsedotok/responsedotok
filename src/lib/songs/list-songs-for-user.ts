import { sql } from '@/db/pool';
import type { SongListItem } from '@/lib/types/song-list-item';

/**
 * Lists the projects a user can see in their dashboard: the ones they own plus
 * the ones they collaborate on, most recently updated first.
 * @param userId The id of the user whose projects to list.
 * @returns An array of project list items.
 */
export async function listSongsForUser(
  userId: string,
): Promise<SongListItem[]> {
  const rows = await sql<SongListItem[]>`
    SELECT
      s.id, s.title, s.genre, s.visibility, s.created_at, s.updated_at,
      (s.owner_id = ${userId}) AS is_owner,
      (
        SELECT COUNT(t.id)::int
        FROM branch b
        JOIN version v ON v.branch_id = b.id
        JOIN track t   ON t.version_id = v.id
        WHERE b.song_id = s.id
      ) AS track_count
    FROM song s
    WHERE s.owner_id = ${userId}
       OR EXISTS (
         SELECT 1 FROM song_collaborator c
         WHERE c.song_id = s.id AND c.user_id = ${userId}
       )
    ORDER BY s.updated_at DESC
  `;
  return [...rows];
}
