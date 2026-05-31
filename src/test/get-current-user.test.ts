// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/auth/sessions/cookies/get-session-cookie', () => ({
  getSessionCookie: vi.fn(),
}));
vi.mock('@/lib/auth/users/get-user-by-session', () => ({
  getUserBySession: vi.fn(),
}));

// React's cache() memoises per module instance, so each scenario re-imports a
// fresh module graph to avoid bleed between tests.
beforeEach(() => vi.resetModules());

async function load() {
  const { getSessionCookie } = await import(
    '@/lib/auth/sessions/cookies/get-session-cookie'
  );
  const { getUserBySession } = await import(
    '@/lib/auth/users/get-user-by-session'
  );
  const { getCurrentUser } = await import('@/lib/auth/users/get-current-user');
  return {
    getCurrentUser,
    getSessionCookie: vi.mocked(getSessionCookie),
    getUserBySession: vi.mocked(getUserBySession),
  };
}

describe('getCurrentUser', () => {
  test('returns null when there is no session cookie', async () => {
    const { getCurrentUser, getSessionCookie, getUserBySession } = await load();
    getSessionCookie.mockResolvedValue(undefined);

    expect(await getCurrentUser()).toBeNull();
    expect(getUserBySession).not.toHaveBeenCalled();
  });

  test('returns null when the session resolves to no user', async () => {
    const { getCurrentUser, getSessionCookie, getUserBySession } = await load();
    getSessionCookie.mockResolvedValue('tok');
    getUserBySession.mockResolvedValue(null);

    expect(await getCurrentUser()).toBeNull();
  });

  test('maps the row to a public user when authenticated', async () => {
    const { getCurrentUser, getSessionCookie, getUserBySession } = await load();
    getSessionCookie.mockResolvedValue('tok');
    getUserBySession.mockResolvedValue({
      id: 'u1',
      username: 'band',
      email: 'band@example.com',
      display_name: 'The Band',
      avatar_url: null,
      bio: null,
      created_at: new Date('2026-01-01T00:00:00Z'),
    });

    const user = await getCurrentUser();
    expect(user).toMatchObject({
      id: 'u1',
      created_at: '2026-01-01T00:00:00.000Z',
    });
  });
});
