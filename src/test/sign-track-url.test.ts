// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { issueSignedToken, presignUrl } = vi.hoisted(() => ({
  issueSignedToken: vi.fn(),
  presignUrl: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({ issueSignedToken, presignUrl }));

import { signTrackUrl } from '@/utils/sign-track-url';

beforeEach(() => {
  issueSignedToken.mockReset();
  presignUrl.mockReset();
});

describe('signTrackUrl', () => {
  test('issues a get-scoped token for the blob pathname and returns the presigned URL', async () => {
    issueSignedToken.mockResolvedValue({
      clientSigningToken: 'cst',
      delegationToken: 'dt',
      validUntil: 999,
    });
    presignUrl.mockResolvedValue({
      presignedUrl: 'https://signed.example/song',
    });

    const before = Date.now();
    const url = await signTrackUrl(
      'https://blob.example.com/folder/song.mp3',
      5000,
    );

    expect(url).toBe('https://signed.example/song');

    const tokenArg = issueSignedToken.mock.calls[0][0];
    expect(tokenArg.pathname).toBe('folder/song.mp3'); // leading slash stripped
    expect(tokenArg.operations).toEqual(['get']);
    expect(tokenArg.validUntil).toBeGreaterThanOrEqual(before + 5000);

    const presignArgs = presignUrl.mock.calls[0];
    expect(presignArgs[0]).toEqual({
      clientSigningToken: 'cst',
      delegationToken: 'dt',
    });
    expect(presignArgs[1]).toMatchObject({
      operation: 'get',
      pathname: 'folder/song.mp3',
      access: 'private',
    });
  });
});
