import { describe, expect, test } from 'vitest';
import { validateLogin } from '@/lib/auth/validation/validate-login';
import { validateSignup } from '@/lib/auth/validation/validate-signup';

describe('validateLogin', () => {
  test('passes for a valid identifier + password', () => {
    expect(
      validateLogin({ identifier: 'band@example.com', password: 'secret' }),
    ).toEqual({});
  });

  test('flags an identifier under 3 chars', () => {
    const errors = validateLogin({ identifier: 'ab', password: 'x' });
    expect(errors.identifier).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  test('flags an identifier over 320 chars', () => {
    const errors = validateLogin({
      identifier: 'a'.repeat(321),
      password: 'x',
    });
    expect(errors.identifier).toBeDefined();
  });

  test('flags an empty password', () => {
    const errors = validateLogin({ identifier: 'band', password: '' });
    expect(errors.password).toBeDefined();
  });
});

describe('validateSignup', () => {
  const valid = {
    username: 'band_01',
    email: 'band@example.com',
    password: 'longenough',
    display_name: 'The Band',
  };

  test('passes for a well-formed signup', () => {
    expect(validateSignup(valid)).toEqual({});
  });

  test.each([
    ['username', { ...valid, username: 'ab' }],
    ['username', { ...valid, username: 'has space' }],
    ['email', { ...valid, email: 'nope' }],
    ['email', { ...valid, email: `${'a'.repeat(320)}@x.co` }],
    ['password', { ...valid, password: 'short' }],
    ['password', { ...valid, password: 'a'.repeat(257) }],
    ['display_name', { ...valid, display_name: '' }],
    ['display_name', { ...valid, display_name: 'a'.repeat(101) }],
  ] as const)('flags %s', (field, input) => {
    const errors = validateSignup(input);
    expect(errors[field]).toBeDefined();
  });

  test('reports password too long distinctly from too short', () => {
    expect(
      validateSignup({ ...valid, password: 'a'.repeat(257) }).password,
    ).toContain('at most');
    expect(validateSignup({ ...valid, password: 'short' }).password).toContain(
      'at least',
    );
  });
});
