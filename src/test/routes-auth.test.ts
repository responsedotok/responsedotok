// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  hash: vi.fn(),
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
  getSessionCookie: vi.fn(),
  getUserBySession: vi.fn(),
  deleteSession: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock('argon2', () => ({
  default: { verify: h.verify, hash: h.hash, argon2id: 'argon2id' },
}));
vi.mock('@/db/pool', () => ({
  sql: Object.assign(vi.fn(), { begin: vi.fn() }),
}));
vi.mock('@/lib/auth/sessions/create-session', () => ({
  createSession: h.createSession,
}));
vi.mock('@/lib/auth/sessions/cookies/set-session-cookie', () => ({
  setSessionCookie: h.setSessionCookie,
}));
vi.mock('@/lib/auth/sessions/cookies/get-session-cookie', () => ({
  getSessionCookie: h.getSessionCookie,
}));
vi.mock('@/lib/auth/users/get-user-by-session', () => ({
  getUserBySession: h.getUserBySession,
}));
vi.mock('@/lib/auth/sessions/delete-session', () => ({
  deleteSession: h.deleteSession,
}));
vi.mock('@/lib/auth/sessions/cookies/clear-session-cookie', () => ({
  clearSessionCookie: h.clearSessionCookie,
}));

import postgres from 'postgres';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as me } from '@/app/api/auth/me/route';
import { POST as signup } from '@/app/api/auth/signup/route';
import { sql } from '@/db/pool';

const mockSql = sql as unknown as Mock;
const mockBegin = (sql as unknown as { begin: Mock }).begin;

const userRow = {
  id: 'u1',
  username: 'band',
  email: 'band@example.com',
  display_name: 'The Band',
  avatar_url: null,
  bio: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
};

function post(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.createSession.mockResolvedValue({ token: 't', expiresAt: new Date() });
});

describe('POST /api/auth/login', () => {
  test('401 on a malformed payload', async () => {
    const res = await login(post({ identifier: 'x' }));
    expect(res.status).toBe(401);
  });

  test('401 when no user matches', async () => {
    mockSql.mockResolvedValueOnce([]);
    const res = await login(post({ identifier: 'band', password: 'secret' }));
    expect(res.status).toBe(401);
  });

  test('401 when the password is wrong', async () => {
    mockSql.mockResolvedValueOnce([{ ...userRow, password_hash: 'h' }]);
    h.verify.mockResolvedValue(false);
    const res = await login(post({ identifier: 'band', password: 'bad' }));
    expect(res.status).toBe(401);
  });

  test('200 + sets a session on valid credentials', async () => {
    mockSql.mockResolvedValueOnce([{ ...userRow, password_hash: 'h' }]);
    h.verify.mockResolvedValue(true);

    const res = await login(post({ identifier: 'band', password: 'secret' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u1', username: 'band' });
    expect(h.createSession).toHaveBeenCalledWith('u1');
    expect(h.setSessionCookie).toHaveBeenCalled();
  });

  test('lowercases the identifier before lookup', async () => {
    mockSql.mockResolvedValueOnce([]);
    await login(post({ identifier: 'BAND@Example.com', password: 'secret' }));
    expect(mockSql.mock.calls[0].slice(1)).toContain('band@example.com');
  });
});

describe('GET /api/auth/me', () => {
  test('401 without a session cookie', async () => {
    h.getSessionCookie.mockResolvedValue(undefined);
    expect((await me()).status).toBe(401);
  });

  test('401 and clears the cookie when the session is stale', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue(null);
    const res = await me();
    expect(res.status).toBe(401);
    expect(h.clearSessionCookie).toHaveBeenCalled();
  });

  test('200 with the public user when authenticated', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue(userRow);
    const res = await me();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u1' });
  });
});

describe('POST /api/auth/logout', () => {
  test('deletes the session when a cookie is present and clears it', async () => {
    h.getSessionCookie.mockResolvedValue('tok');
    const res = await logout();
    expect(h.deleteSession).toHaveBeenCalledWith('tok');
    expect(h.clearSessionCookie).toHaveBeenCalled();
    expect(await res.json()).toEqual({ ok: true });
  });

  test('still clears the cookie when there is no session', async () => {
    h.getSessionCookie.mockResolvedValue(undefined);
    await logout();
    expect(h.deleteSession).not.toHaveBeenCalled();
    expect(h.clearSessionCookie).toHaveBeenCalled();
  });
});

describe('POST /api/auth/signup', () => {
  const valid = {
    username: 'band_01',
    email: 'Band@Example.com',
    password: 'longenough',
    display_name: 'The Band',
  };

  test('400 on a malformed payload', async () => {
    expect((await signup(post({ username: 'x' }))).status).toBe(400);
  });

  test('201 + creates user, session, cookie on success', async () => {
    h.hash.mockResolvedValue('hashed');
    mockBegin.mockImplementation(async (cb: (tx: Mock) => unknown) => {
      const tx = vi
        .fn()
        .mockResolvedValueOnce([userRow])
        .mockResolvedValueOnce(undefined) as Mock;
      return cb(tx);
    });

    const res = await signup(post(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ id: 'u1' });
    expect(h.createSession).toHaveBeenCalledWith('u1');
    expect(h.setSessionCookie).toHaveBeenCalled();
  });

  test('409 with the email field on a unique-violation', async () => {
    h.hash.mockResolvedValue('hashed');
    const err = Object.create(postgres.PostgresError.prototype);
    err.code = '23505';
    err.constraint_name = 'user_email_uq';
    mockBegin.mockRejectedValue(err);

    const res = await signup(post(valid));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'The email is already in use' });
  });

  test('409 defaults to the username field for other unique violations', async () => {
    h.hash.mockResolvedValue('hashed');
    const err = Object.create(postgres.PostgresError.prototype);
    err.code = '23505';
    err.constraint_name = 'user_username_uq';
    mockBegin.mockRejectedValue(err);

    expect(await (await signup(post(valid))).json()).toEqual({
      error: 'The username is already in use',
    });
  });

  test('rethrows non-unique errors', async () => {
    h.hash.mockResolvedValue('hashed');
    mockBegin.mockRejectedValue(new Error('connection lost'));
    await expect(signup(post(valid))).rejects.toThrow('connection lost');
  });
});
