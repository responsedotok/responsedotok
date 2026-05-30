import type { ApiResult } from '@/lib/types/api-result';
import { API_URL } from '@/lib/constants/constants';

/**
 * Makes an API request.
 * @param path The API endpoint path.
 * @param init The fetch request initialization options.
 * @returns The API result.
 */
export async function _request<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  // 204 / empty bodies — don't try to parse.
  const text = await res.text();
  const body = text ? (JSON.parse(text) as T) : null;

  return { status: res.status, ok: res.ok, body };
}
