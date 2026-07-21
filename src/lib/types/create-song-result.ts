import type { SongTextInput } from '@/lib/songs/validate-song-form';
import type { FieldErrors } from '@/lib/types/field-errors';

export type CreateSongResult =
  | { ok: true; songId: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors<SongTextInput> };
