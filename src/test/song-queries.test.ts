// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/db/pool', () => ({ sql: vi.fn() }));

import { sql } from '@/db/pool';
import { getSongDetail } from '@/lib/songs/get-song-detail';
import { getWorkingVersion } from '@/lib/songs/get-working-version';
import { listSongsForUser } from '@/lib/songs/list-songs-for-user';

const mockSql = sql as unknown as Mock;

beforeEach(() => mockSql.mockReset());

describe('listSongsForUser', () => {
  test('returns a plain array copy of the rows', async () => {
    const rows = [{ id: 's1', title: 'A', is_owner: true, track_count: 2 }];
    mockSql.mockResolvedValueOnce(rows);
    const result = await listSongsForUser('u1');
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows); // spread copy, not the live result
  });
});

describe('getWorkingVersion', () => {
  test('returns the version id when one exists', async () => {
    mockSql.mockResolvedValueOnce([{ id: 'v1' }]);
    expect(await getWorkingVersion('s1')).toBe('v1');
  });

  test('returns null when the song has no default branch/version', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await getWorkingVersion('s1')).toBeNull();
  });
});

describe('getSongDetail', () => {
  test('returns null when the song does not exist (no track query)', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await getSongDetail('missing')).toBeNull();
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  test('returns the song with its ordered tracks', async () => {
    const song = {
      id: 's1',
      title: 'Midnight Drive',
      owner_id: 'u1',
      owner_name: 'Adam',
    };
    const tracks = [{ id: 't1', name: 'Full Mix', order: 10 }];
    mockSql.mockResolvedValueOnce([song]).mockResolvedValueOnce(tracks);

    const result = await getSongDetail('s1');
    expect(result).toMatchObject({ id: 's1', title: 'Midnight Drive' });
    expect(result?.tracks).toEqual(tracks);
    expect(mockSql).toHaveBeenCalledTimes(2);
  });
});
