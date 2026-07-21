import { sql } from '@/db/pool';

/**
 * Returns the id of a song's working version — the most recent version on its
 * default ('main') branch. In the lean v1 model every song has exactly one
 * branch and one version, but this is written to tolerate future versions.
 * @param songId The song to look up.
 * @returns The working version id, or null if the song has no default branch.
 */
export async function getWorkingVersion(
  songId: string,
): Promise<string | null> {
  const [row] = await sql<{ id: string }[]>`
    SELECT v.id
    FROM version v
    JOIN branch b ON b.id = v.branch_id
    WHERE b.song_id = ${songId} AND b.is_default = true
    ORDER BY v.created_at DESC
    LIMIT 1
  `;
  return row?.id ?? null;
}
