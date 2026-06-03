// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/db/pool', () => ({ sql: vi.fn() }));

import { sql } from '@/db/pool';
import { getPresskitByToken } from '@/lib/presskits/get-presskit-by-token';
import { listPresskitsForUser } from '@/lib/presskits/list-presskits-for-user';

const mockSql = sql as unknown as Mock;

beforeEach(() => mockSql.mockReset());

describe('getPresskitByToken', () => {
  test('returns null when no kit matches', async () => {
    mockSql.mockResolvedValueOnce([]); // kit lookup
    expect(await getPresskitByToken('missing')).toBeNull();
    expect(mockSql).toHaveBeenCalledTimes(1); // never queries tracks
  });

  test('returns the kit with its ordered tracks', async () => {
    const kit = {
      id: 'k1',
      artist_name: 'Band',
      recipient_name: 'Jordan',
      recipient_org: null,
      greeting: 'Hi',
      pitch: 'Pitch',
      created_at: new Date(),
    };
    const tracks = [{ id: 't1', blob_url: 'u', filename: 'f', position: 1 }];
    mockSql.mockResolvedValueOnce([kit]).mockResolvedValueOnce(tracks);

    const result = await getPresskitByToken('tok');
    expect(result).toMatchObject({ id: 'k1', artist_name: 'Band' });
    expect(result?.tracks).toEqual(tracks);
    expect(mockSql).toHaveBeenCalledTimes(2);
  });
});

describe('listPresskitsForUser', () => {
  test('returns a plain array copy of the rows', async () => {
    const rows = [{ token: 'a', view_count: 3 }];
    mockSql.mockResolvedValueOnce(rows);

    const result = await listPresskitsForUser('u1');
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows); // spread copy, not the live result
  });
});
