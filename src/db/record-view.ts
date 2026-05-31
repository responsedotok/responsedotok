'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { sql } from '@/db/pool';

/**
 * Records one open of a kit link. Inserts only for a valid, non-revoked kit
 * (the SELECT supplies the kit_id), so bad tokens are silently ignored.
 * @param token The token of the press kit
 */
export async function recordView(token: string): Promise<void> {
  const h = await headers();
  const userAgent = h.get('user-agent');
  const referrer = h.get('referer');
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : null;

  await sql`
    INSERT INTO press_kit_view (kit_id, ip_hash, user_agent, referrer)
    SELECT id, ${ipHash}, ${userAgent}, ${referrer}
    FROM press_kit
    WHERE token = ${token} AND revoked_at IS NULL
  `;
}
