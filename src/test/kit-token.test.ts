import { describe, expect, test } from 'vitest';
import { generateKitToken } from '@/lib/kit-token';

// The DB enforces this exact shape via press_kit_token_format_ck.
const TOKEN_CONSTRAINT = /^[A-Za-z0-9_-]{16,64}$/;

describe('generateKitToken', () => {
  test('produces a URL-safe token matching the DB constraint', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateKitToken()).toMatch(TOKEN_CONSTRAINT);
    }
  });

  test('is effectively unique across calls', () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generateKitToken()),
    );
    expect(tokens.size).toBe(1000);
  });
});
