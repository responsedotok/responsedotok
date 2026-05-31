import { describe, expect, test } from 'vitest';
import { getPublicUser } from '@/lib/auth/users/get-public-user';
import { EMAIL_PATTERN, USERNAME_PATTERN } from '@/lib/constants/constants';
import type { PublicUserRow } from '@/lib/types/public-user-row';

describe('constants patterns', () => {
  test('USERNAME_PATTERN accepts 3–32 word chars only', () => {
    expect(USERNAME_PATTERN.test('abc')).toBe(true);
    expect(USERNAME_PATTERN.test('a_1_B')).toBe(true);
    expect(USERNAME_PATTERN.test('ab')).toBe(false);
    expect(USERNAME_PATTERN.test('a'.repeat(33))).toBe(false);
    expect(USERNAME_PATTERN.test('has space')).toBe(false);
    expect(USERNAME_PATTERN.test('dash-no')).toBe(false);
  });

  test('EMAIL_PATTERN accepts a basic address and rejects malformed ones', () => {
    expect(EMAIL_PATTERN.test('a@b.co')).toBe(true);
    expect(EMAIL_PATTERN.test('no-at')).toBe(false);
    expect(EMAIL_PATTERN.test('a@b')).toBe(false);
    expect(EMAIL_PATTERN.test('a @b.co')).toBe(false);
  });
});

describe('getPublicUser', () => {
  test('maps a row and serialises created_at to ISO', () => {
    const created = new Date('2026-01-02T03:04:05.000Z');
    const row: PublicUserRow = {
      id: 'u1',
      username: 'band',
      email: 'band@example.com',
      display_name: 'The Band',
      avatar_url: null,
      bio: null,
      created_at: created,
    };

    expect(getPublicUser(row)).toEqual({
      id: 'u1',
      username: 'band',
      email: 'band@example.com',
      display_name: 'The Band',
      avatar_url: null,
      bio: null,
      created_at: '2026-01-02T03:04:05.000Z',
    });
  });
});
