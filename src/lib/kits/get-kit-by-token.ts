import { sql } from '@/db/pool';
import type { KitWithTracks } from '@/lib/types/kit-with-tracks';
import type { KitTrack } from '../types/kit-track';

/**
 * Retrieves a press kit by its token.
 * @param token The token of the press kit to retrieve.
 * @returns The press kit with its tracks, or null if not found or revoked.
 */
export async function getKitByToken(
  token: string,
): Promise<KitWithTracks | null> {
  const [kit] = await sql<Omit<KitWithTracks, 'tracks'>[]>`
    SELECT id, artist_name, recipient_name, recipient_org,
           greeting, pitch, created_at
    FROM press_kit
    WHERE token = ${token} AND revoked_at IS NULL
  `;
  if (!kit) return null;

  const tracks = await sql<KitTrack[]>`
    SELECT id, blob_url, filename, mime_type, size_bytes, position
    FROM press_kit_track
    WHERE kit_id = ${kit.id}
    ORDER BY position
  `;

  return { ...kit, tracks: [...tracks] };
}
