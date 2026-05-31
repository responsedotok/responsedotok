// @vitest-environment node
import { createHash } from 'node:crypto';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const headerMap = new Map<string, string>();

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (k: string) => headerMap.get(k.toLowerCase()) ?? null,
  }),
}));
vi.mock('@/db/pool', () => ({ sql: vi.fn() }));

import { sql } from '@/db/pool';
import { recordView } from '@/db/record-view';

const mockSql = sql as unknown as Mock;

beforeEach(() => {
  mockSql.mockReset();
  mockSql.mockResolvedValue(undefined);
  headerMap.clear();
});

describe('recordView', () => {
  test('hashes the first x-forwarded-for IP and passes UA + referrer', async () => {
    headerMap.set('user-agent', 'vitest-UA');
    headerMap.set('referer', 'https://label.example/');
    headerMap.set('x-forwarded-for', '203.0.113.7, 10.0.0.1');

    await recordView('tok');

    const values = mockSql.mock.calls[0].slice(1);
    const expectedHash = createHash('sha256')
      .update('203.0.113.7')
      .digest('hex');
    expect(values).toContain(expectedHash);
    expect(values).toContain('vitest-UA');
    expect(values).toContain('https://label.example/');
  });

  test('passes null ip_hash when there is no forwarded IP', async () => {
    await recordView('tok');
    const values = mockSql.mock.calls[0].slice(1);
    // ip_hash, user_agent, referrer all null/absent
    expect(values).toContain(null);
  });
});
