// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  getSessionCookie: vi.fn(),
  getUserBySession: vi.fn(),
}));

vi.mock('@/db/pool', () => ({
  sql: Object.assign(vi.fn(), { begin: vi.fn() }),
}));
vi.mock('@/lib/auth/sessions/cookies/get-session-cookie', () => ({
  getSessionCookie: h.getSessionCookie,
}));
vi.mock('@/lib/auth/users/get-user-by-session', () => ({
  getUserBySession: h.getUserBySession,
}));

import { createPresskit } from '@/app/(app)/presskit/create-presskit';
import { sql } from '@/db/pool';

const mockBegin = (sql as unknown as { begin: Mock }).begin;

const track = {
  blob_url: 'https://blob.example.com/song.mp3',
  filename: 'song.mp3',
  mime_type: 'audio/mpeg',
  size_bytes: 1234,
};
const validInput = {
  artist_name: 'The Testers',
  recipient_name: 'Jordan',
  greeting: 'Hi Jordan,',
  pitch: 'We fit your roster.',
  tracks: [track],
};

beforeEach(() => vi.clearAllMocks());

describe('createPresskit', () => {
  test('rejects when not signed in', async () => {
    h.getSessionCookie.mockResolvedValue(undefined);
    const res = await createPresskit(validInput);
    expect(res).toEqual({ ok: false, error: 'You must be signed in.' });
    expect(mockBegin).not.toHaveBeenCalled();
  });

  test('rejects an invalid form (e.g. 3 tracks) without touching the DB', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });
    const res = await createPresskit({
      ...validInput,
      tracks: [track, track, track],
    });
    expect(res.ok).toBe(false);
    expect(mockBegin).not.toHaveBeenCalled();
  });

  test('persists the kit + tracks and returns a token', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });

    const tx = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'kit-1' }])
      .mockResolvedValue(undefined);
    mockBegin.mockImplementation(async (cb: (t: Mock) => unknown) => cb(tx));

    const res = await createPresskit(validInput);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.token).toMatch(/^[A-Za-z0-9_-]{16,64}$/);

    // First call inserts the kit; subsequent calls insert each track.
    expect(tx.mock.calls[0].slice(1)).toContain('u1');
    expect(tx).toHaveBeenCalledTimes(2); // 1 kit + 1 track
  });

  test('maps an empty recipient_org to null', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });

    const tx = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'kit-1' }])
      .mockResolvedValue(undefined);
    mockBegin.mockImplementation(async (cb: (t: Mock) => unknown) => cb(tx));

    await createPresskit({ ...validInput, recipient_org: '' });
    expect(tx.mock.calls[0].slice(1)).toContain(null);
  });
});
