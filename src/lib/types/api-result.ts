export type ApiResult<T = unknown> = {
  status: number;
  ok: boolean;
  body: T | { error?: string } | null;
};