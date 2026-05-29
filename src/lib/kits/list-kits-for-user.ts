
import { sql } from "@/db/pool";
import { KitListItem } from "../types/kit-list-item";


/**
 * Lists all press kits for a given user.
 * @param userId The ID of the user whose press kits to list.
 * @returns An array of press kit list items.
 */
export async function listKitsForUser(userId: string): Promise<KitListItem[]> {
    const rows = await sql<KitListItem[]>`
    SELECT
      k.token, k.artist_name, k.recipient_name, k.recipient_org,
      k.created_at, k.revoked_at,
      COUNT(v.id)::int        AS view_count,
      MAX(v.viewed_at)        AS last_viewed_at
    FROM press_kit k
    LEFT JOIN press_kit_view v ON v.kit_id = k.id
    WHERE k.owner_id = ${userId}
    GROUP BY k.id
    ORDER BY k.created_at DESC
  `;
  return [...rows];
}
