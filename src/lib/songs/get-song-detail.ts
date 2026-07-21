import { sql } from '@/db/pool';
import type { SongDetail } from '@/lib/types/song-detail';
import type { SongTrack } from '@/lib/types/song-track';

/**
 * Loads a project and the tracks on its working version, each joined to its
 * audio file (if uploaded) and the collaborator who uploaded it. Does NOT
 * enforce access — call getSongAccess first.
 * @param songId The project to load.
 * @returns The project with its ordered tracks, or null if it does not exist.
 */
export async function getSongDetail(
  songId: string,
): Promise<SongDetail | null> {
  const [song] = await sql<Omit<SongDetail, 'tracks'>[]>`
    SELECT
      s.id, s.title, s.genre, s.description, s.visibility,
      s.owner_id, u.display_name AS owner_name, s.share_token,
      s.created_at, s.updated_at
    FROM song s
    JOIN "user" u ON u.id = s.owner_id
    WHERE s.id = ${songId}
  `;
  if (!song) return null;

  const tracks = await sql<SongTrack[]>`
    SELECT
      t.id, t.name, t.type, t."order", t.uploaded_by,
      up.display_name         AS uploader_name,
      a.storage_path, a.filename, a.mime_type,
      a.duration_ms::int      AS duration_ms
    FROM branch b
    JOIN version v ON v.branch_id = b.id
    JOIN track t   ON t.version_id = v.id
    LEFT JOIN audio_file a ON a.track_id = t.id
    LEFT JOIN "user" up    ON up.id = t.uploaded_by
    WHERE b.song_id = ${songId} AND b.is_default = true
    ORDER BY t."order", t.id
  `;

  return { ...song, tracks: [...tracks] };
}
