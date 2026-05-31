// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  handleUpload: vi.fn(),
  getSessionCookie: vi.fn(),
  getUserBySession: vi.fn(),
}));

vi.mock('@vercel/blob/client', () => ({ handleUpload: h.handleUpload }));
vi.mock('@/lib/auth/sessions/cookies/get-session-cookie', () => ({
  getSessionCookie: h.getSessionCookie,
}));
vi.mock('@/lib/auth/users/get-user-by-session', () => ({
  getUserBySession: h.getUserBySession,
}));

import { POST as upload } from '@/app/api/presskits/upload/route';

function req(body: unknown = {}) {
  return new Request('http://localhost/api/presskits/upload', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/presskits/upload', () => {
  test('returns the handleUpload result on success', async () => {
    h.handleUpload.mockResolvedValue({ type: 'blob.generate-client-token' });
    const res = await upload(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ type: 'blob.generate-client-token' });
  });

  test('400 when handleUpload throws', async () => {
    h.handleUpload.mockRejectedValue(new Error('bad token'));
    const res = await upload(req());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad token' });
  });

  test('onBeforeGenerateToken rejects an unauthenticated upload', async () => {
    // Drive the callback handleUpload would normally invoke.
    h.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: () => Promise<unknown>;
      }) => onBeforeGenerateToken(),
    );
    h.getSessionCookie.mockResolvedValue(undefined);

    const res = await upload(req());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'You must be signed in to upload.',
    });
  });

  test('onBeforeGenerateToken returns audio constraints + user payload when authed', async () => {
    let config: Record<string, unknown> | undefined;
    h.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: () => Promise<Record<string, unknown>>;
      }) => {
        config = await onBeforeGenerateToken();
        return { ok: true };
      },
    );
    h.getSessionCookie.mockResolvedValue('tok');
    h.getUserBySession.mockResolvedValue({ id: 'u1' });

    await upload(req());
    expect(config).toMatchObject({ tokenPayload: 'u1' });
    expect(config?.allowedContentTypes as string[]).toContain('audio/mpeg');
  });
});
