import type { FieldErrors } from '@/lib/types/field-errors';

/**
 * The free-text fields of the create-project form, shared between the client
 * form (pre-submit) and the createSong server action so both report the same
 * per-field messages. Visibility is validated separately via the zod enum.
 */
export type SongTextInput = {
  title?: unknown;
  genre?: unknown;
  description?: unknown;
};

/**
 * Validates the text fields of the create-project form.
 * @param input The song text fields to validate.
 * @returns An object containing field errors, if any.
 */
export function validateSongForm(
  input: SongTextInput,
): FieldErrors<SongTextInput> {
  const errors: FieldErrors<SongTextInput> = {};
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const title = text(input.title);
  if (title.length < 1) {
    errors.title = 'Give your project a title.';
  } else if (title.length > 200) {
    errors.title = 'Title must be at most 200 characters.';
  }

  if (text(input.genre).length > 50) {
    errors.genre = 'Genre must be at most 50 characters.';
  }

  if (text(input.description).length > 5000) {
    errors.description = 'Description must be at most 5000 characters.';
  }

  return errors;
}
