// @vitest-environment node

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/db/pool', () => ({ sql: vi.fn() }));

import { sql } from '@/db/pool';
import { getSongAccess } from '@/lib/songs/access';

const mockSql = sql as unknown as Mock;

beforeEach(() => mockSql.mockReset());

describe('getSongAccess', () => {
  test('returns null when the song does not exist', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await getSongAccess('missing', 'u1')).toBeNull();
  });

  test('owner can view and contribute', async () => {
    mockSql.mockResolvedValueOnce([
      { owner_id: 'u1', visibility: 'private', role: null },
    ]);
    const a = await getSongAccess('s1', 'u1');
    expect(a).toMatchObject({
      isOwner: true,
      role: null,
      canView: true,
      canContribute: true,
    });
  });

  test('signed-out visitor can view a public song but not contribute', async () => {
    mockSql.mockResolvedValueOnce([
      { owner_id: 'someone', visibility: 'public', role: null },
    ]);
    const a = await getSongAccess('s1', null);
    expect(a).toMatchObject({
      isOwner: false,
      canView: true,
      canContribute: false,
    });
  });

  test('non-owner, non-collaborator cannot view a private song', async () => {
    mockSql.mockResolvedValueOnce([
      { owner_id: 'someone', visibility: 'private', role: null },
    ]);
    const a = await getSongAccess('s1', 'u2');
    expect(a).toMatchObject({ canView: false, canContribute: false });
  });

  test('contributor collaborator can view and contribute', async () => {
    mockSql.mockResolvedValueOnce([
      { owner_id: 'someone', visibility: 'private', role: 'contributor' },
    ]);
    const a = await getSongAccess('s1', 'u2');
    expect(a).toMatchObject({
      isOwner: false,
      role: 'contributor',
      canView: true,
      canContribute: true,
    });
  });

  test('viewer collaborator can view but not contribute', async () => {
    mockSql.mockResolvedValueOnce([
      { owner_id: 'someone', visibility: 'private', role: 'viewer' },
    ]);
    const a = await getSongAccess('s1', 'u2');
    expect(a).toMatchObject({
      role: 'viewer',
      canView: true,
      canContribute: false,
    });
  });
});
