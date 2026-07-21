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

import { createSong } from '@/app/(app)/_utils/create-song';
import { sql } from '@/db/pool';

const mockBegin = (sql as unknown as { begin: Mock }).begin;

const validInput = {
  title: 'Midnight Drive',
  genre: 'Synthwave',
  description: 'Late-night cruise energy.',
  visibility: 'private' as const,
};

// Bootstrap tx: song insert, branch insert, version insert.
function bootstrapTx() {
  return vi
    .fn()
    .mockResolvedValueOnce([{ id: 'song-1' }])
    .mockResolvedValueOnce([{ id: 'branch-1' }])
    .mockResolvedValue(undefined);
}

beforeEach(() => vi.clearAllMocks());

describe('createSong', () => {
  test('rejects when not signed in', async () => {
    h.getSessionCookie.mockResolvedValue(undefined);
    const res = await createSong(validInput);
    expect(res).toEqual({ ok: false, error: 'You must be signed in.' });
    expect(mockBegin).not.toHaveBeenCalled();
  });

  test('names the failing field when the title is empty', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });
    const res = await createSong({ ...validInput, title: '   ' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.title).toMatch(/title/i);
    expect(mockBegin).not.toHaveBeenCalled();
  });

  test('bootstraps song + main branch + initial version and returns the id', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });

    const tx = bootstrapTx();
    mockBegin.mockImplementation(async (cb: (t: Mock) => unknown) => cb(tx));

    const res = await createSong(validInput);
    expect(res).toEqual({ ok: true, songId: 'song-1' });
    expect(tx).toHaveBeenCalledTimes(3); // song + branch + version
    // The song insert is attributed to the signed-in user.
    expect(tx.mock.calls[0].slice(1)).toContain('u1');
  });

  test('maps empty optional fields to null', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });

    const tx = bootstrapTx();
    mockBegin.mockImplementation(async (cb: (t: Mock) => unknown) => cb(tx));

    await createSong({ ...validInput, genre: '', description: '' });
    // song insert carries two nulls (genre, description).
    const songArgs = tx.mock.calls[0].slice(1);
    expect(songArgs.filter((v: unknown) => v === null)).toHaveLength(2);
  });
});
