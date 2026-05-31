// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/db/pool', () => ({ sql: vi.fn() }));

import { sql } from '@/db/pool';
import { createSession } from '@/lib/auth/sessions/create-session';
import { deleteSession } from '@/lib/auth/sessions/delete-session';
import { hashToken } from '@/lib/auth/tokens/hash-token';
import { getUserBySession } from '@/lib/auth/users/get-user-by-session';

const mockSql = sql as unknown as Mock;

beforeEach(() => mockSql.mockReset());

describe('createSession', () => {
  test('returns a hex token and a future expiry, and inserts a hashed id', async () => {
    process.env.SESSION_LIFETIME_MS = '3600000';
    mockSql.mockResolvedValueOnce(undefined);

    const before = Date.now();
    const { token, expiresAt } = await createSession('user-1');

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(before);
    // The stored id is the hash of the token, never the token itself.
    const values = mockSql.mock.calls[0].slice(1);
    expect(values).toContain(hashToken(token));
    expect(values).not.toContain(token);
  });
});

describe('deleteSession', () => {
  test('deletes by the hashed token', async () => {
    mockSql.mockResolvedValueOnce(undefined);
    await deleteSession('rawtoken');
    expect(mockSql.mock.calls[0].slice(1)).toContain(hashToken('rawtoken'));
  });
});

describe('getUserBySession', () => {
  test('returns the row when the session resolves to a user', async () => {
    const row = { id: 'u1', username: 'band' };
    mockSql.mockResolvedValueOnce([row]);
    expect(await getUserBySession('tok')).toBe(row);
  });

  test('returns null when no active session matches', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await getUserBySession('tok')).toBeNull();
  });
});
