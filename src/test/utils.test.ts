import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { msgFromBody } from '@/utils/msg-from-body';

describe('msgFromBody', () => {
  test('returns null for falsy bodies', () => {
    expect(msgFromBody(null)).toBeNull();
    expect(msgFromBody(undefined)).toBeNull();
    expect(msgFromBody('')).toBeNull();
  });

  test('returns the string body verbatim', () => {
    expect(msgFromBody('boom')).toBe('boom');
  });

  test('extracts a string `error` field', () => {
    expect(msgFromBody({ error: 'nope' })).toBe('nope');
  });

  test('returns null when `error` is not a string', () => {
    expect(msgFromBody({ error: 42 })).toBeNull();
    expect(msgFromBody({ other: 'x' })).toBeNull();
  });
});

describe('_request', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  function res(status: number, text: string) {
    return {
      status,
      ok: status >= 200 && status < 300,
      text: async () => text,
    };
  }

  test('parses a JSON body and returns status/ok', async () => {
    fetchMock.mockResolvedValue(res(200, JSON.stringify({ id: '1' })));
    const { _request } = await import('@/utils/_request');
    const result = await _request<{ id: string }>('/x');
    expect(result).toEqual({ status: 200, ok: true, body: { id: '1' } });
  });

  test('returns a null body for empty responses', async () => {
    fetchMock.mockResolvedValue(res(204, ''));
    const { _request } = await import('@/utils/_request');
    const result = await _request('/x', { method: 'POST' });
    expect(result.body).toBeNull();
    expect(result.ok).toBe(true);
  });

  test('sets a JSON content-type only when a body is present', async () => {
    fetchMock.mockResolvedValue(res(200, '{}'));
    const { _request } = await import('@/utils/_request');

    await _request('/x', { body: JSON.stringify({ a: 1 }) });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      'content-type': 'application/json',
    });

    await _request('/y');
    expect(fetchMock.mock.calls[1][1].headers['content-type']).toBeUndefined();
  });

  test('sends credentials for cookie-based auth', async () => {
    fetchMock.mockResolvedValue(res(200, '{}'));
    const { _request } = await import('@/utils/_request');
    await _request('/x');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });
});
