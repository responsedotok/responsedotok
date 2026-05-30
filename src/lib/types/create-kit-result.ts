export type CreateKitResult =
  | { ok: true; token: string }
  | { ok: false; error: string };
