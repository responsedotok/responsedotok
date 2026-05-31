// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest';

const store = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({ cookies: async () => store }));

import { clearSessionCookie } from '@/lib/auth/sessions/cookies/clear-session-cookie';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { setSessionCookie } from '@/lib/auth/sessions/cookies/set-session-cookie';

const COOKIE = process.env.SESSION_COOKIE ?? 'session';

beforeEach(() => {
  store.get.mockReset();
  store.set.mockReset();
  store.delete.mockReset();
});

describe('getSessionCookie', () => {
  test('returns the cookie value when present', async () => {
    store.get.mockReturnValue({ value: 'tok123' });
    expect(await getSessionCookie()).toBe('tok123');
    expect(store.get).toHaveBeenCalledWith(COOKIE);
  });

  test('returns undefined when the cookie is absent', async () => {
    store.get.mockReturnValue(undefined);
    expect(await getSessionCookie()).toBeUndefined();
  });
});

describe('setSessionCookie', () => {
  test('writes an httpOnly, lax, root-path cookie with the given expiry', async () => {
    const expires = new Date('2026-06-01T00:00:00Z');
    await setSessionCookie('tok', expires);

    expect(store.set).toHaveBeenCalledWith(
      COOKIE,
      'tok',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires,
      }),
    );
  });
});

describe('clearSessionCookie', () => {
  test('deletes the cookie by name and path', async () => {
    await clearSessionCookie();
    expect(store.delete).toHaveBeenCalledWith({ name: COOKIE, path: '/' });
  });
});
