import { describe, expect, test } from 'vitest';
import { loginSchema } from '@/lib/auth/schemas/login-schema';
import { signupSchema } from '@/lib/auth/schemas/signup-schema';

describe('signupSchema', () => {
  const valid = {
    username: 'band_01',
    email: 'band@example.com',
    password: 'longenough',
    display_name: 'The Band',
  };

  test('accepts a well-formed signup', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  test.each([
    ['username too short', { ...valid, username: 'ab' }],
    ['username with spaces', { ...valid, username: 'the band' }],
    ['bad email', { ...valid, email: 'not-an-email' }],
    ['password under 8 chars', { ...valid, password: 'short' }],
    ['empty display name', { ...valid, display_name: '' }],
  ])('rejects %s', (_label, input) => {
    expect(signupSchema.safeParse(input).success).toBe(false);
  });
});

describe('loginSchema', () => {
  test('accepts identifier + password', () => {
    expect(
      loginSchema.safeParse({ identifier: 'band@example.com', password: 'x' })
        .success,
    ).toBe(true);
  });

  test('rejects a too-short identifier', () => {
    expect(
      loginSchema.safeParse({ identifier: 'ab', password: 'x' }).success,
    ).toBe(false);
  });

  test('rejects an empty password', () => {
    expect(
      loginSchema.safeParse({ identifier: 'band@example.com', password: '' })
        .success,
    ).toBe(false);
  });
});
