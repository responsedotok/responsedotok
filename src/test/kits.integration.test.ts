// @vitest-environment node
//
// End-to-end coverage of the press-kit data path against the real Neon DB and
// Vercel Blob store. next/headers is mocked so the server action / view
// recorder can read a session cookie and request headers outside a request.
//
// Skips automatically when secrets aren't present (e.g. CI without .env.local).

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

const ctx = vi.hoisted(() => ({
  sessionToken: null as string | null,
  reqHeaders: new Map<string, string>(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === (process.env.SESSION_COOKIE ?? 'session') && ctx.sessionToken
        ? { value: ctx.sessionToken }
        : undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: async () => ({
    get: (key: string) => ctx.reqHeaders.get(key.toLowerCase()) ?? null,
  }),
}));

import { put } from '@vercel/blob';
import { createPresskit } from '@/app/(app)/presskit/create-presskit';
import { recordView } from '@/db/record-view';
import { createSession } from '@/lib/auth/sessions/create-session';
import { sql } from '@/db/pool';
import { getKitByToken } from '@/lib/kits/get-kit-by-token';
import { signTrackUrl } from '@/lib/kits/sign-track-url';
import { listKitsForUser } from '@/lib/kits/list-kits-for-user' 
const hasSecrets = Boolean(
  process.env.DATABASE_URL && process.env.BLOB_READ_WRITE_TOKEN,
);

describe.skipIf(!hasSecrets)('press kit data path (integration)', () => {
  let userId: string;
  let blobUrl: string;
  let createdToken: string;

  beforeAll(async () => {
    const username = `itest_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const [user] = await sql<{ id: string }[]>`
      INSERT INTO "user" (username, email, display_name)
      VALUES (${username}, ${`${username}@example.com`}, 'Integration Test')
      RETURNING id
    `;
    userId = user.id;

    // Real session so the mocked cookie resolves to this user.
    const session = await createSession(userId);
    ctx.sessionToken = session.token;
    ctx.reqHeaders.set('user-agent', 'vitest');
    ctx.reqHeaders.set('referer', 'https://label.example.com/');
    ctx.reqHeaders.set('x-forwarded-for', '203.0.113.7');

    const blob = await put(
      `itest/song-${Date.now()}.mp3`,
      Buffer.from('FAKEAUDIO_DATA'),
      { access: 'private', addRandomSuffix: true, contentType: 'audio/mpeg' },
    );
    blobUrl = blob.url;
  }, 30_000);

  afterAll(async () => {
    if (blobUrl) {
      const { del } = await import('@vercel/blob');
      await del(blobUrl).catch(() => {});
    }
    if (userId) {
      // Cascades to press_kit, press_kit_track, press_kit_view, session.
      await sql`DELETE FROM "user" WHERE id = ${userId}`;
    }
    await sql.end();
  });

  test('createPressKit persists a kit and its track', async () => {
    const res = await createPresskit({
      artist_name: 'The Testers',
      recipient_name: 'Jordan',
      recipient_org: 'XL Recordings',
      greeting: 'Hi Jordan,',
      pitch: 'We think our sound fits your roster.',
      tracks: [
        {
          blob_url: blobUrl,
          filename: 'song.mp3',
          mime_type: 'audio/mpeg',
          size_bytes: 14,
        },
      ],
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    createdToken = res.token;
    expect(res.token).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
  });

  test('createPressKit rejects 3+ tracks', async () => {
    const track = {
      blob_url: blobUrl,
      filename: 's.mp3',
      mime_type: 'audio/mpeg',
      size_bytes: 14,
    };
    const res = await createPresskit({
      artist_name: 'X',
      recipient_name: 'Y',
      greeting: 'Hi,',
      pitch: 'too many',
      tracks: [track, track, track],
    });
    expect(res.ok).toBe(false);
  });

  test('getKitByToken returns the kit with its track', async () => {
    const kit = await getKitByToken(createdToken);
    expect(kit).not.toBeNull();
    expect(kit?.artist_name).toBe('The Testers');
    expect(kit?.recipient_org).toBe('XL Recordings');
    expect(kit?.tracks).toHaveLength(1);
    expect(kit?.tracks[0].blob_url).toBe(blobUrl);
  });

  test('getKitByToken returns null for an unknown token', async () => {
    expect(await getKitByToken('deadbeefdeadbeef')).toBeNull();
  });

  test('signTrackUrl yields a streamable URL; bare URL is forbidden', async () => {
    const bare = await fetch(blobUrl);
    expect([401, 403]).toContain(bare.status);

    const signed = await signTrackUrl(blobUrl);
    const res = await fetch(signed);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('FAKEAUDIO_DATA');
  });

  test('recordView increments the open count', async () => {
    const before = await listKitsForUser(userId);
    expect(before[0].view_count).toBe(0);
    expect(before[0].last_viewed_at).toBeNull();

    await recordView(createdToken);
    await recordView(createdToken);

    const after = await listKitsForUser(userId);
    expect(after[0].view_count).toBe(2);
    expect(after[0].last_viewed_at).not.toBeNull();
  });

  test('recordView ignores unknown tokens', async () => {
    await expect(recordView('deadbeefdeadbeef')).resolves.toBeUndefined();
  });
});
