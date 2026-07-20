import type { CreateKitInput } from '@/lib/types/create-kit-input';
import type { FieldErrors } from '@/lib/types/field-errors';

export type PresskitTextInput = Omit<CreateKitInput, 'tracks'>;

/**
 * Validates the text fields of the press kit form.
 * Shared by the form (pre-upload) and the createPresskit server action, so
 * both report the same per-field messages.
 * @param input The press kit text fields to validate.
 * @returns An object containing field errors, if any.
 */
export function validatePresskitForm(
  input: PresskitTextInput,
): FieldErrors<PresskitTextInput> {
  const errors: FieldErrors<PresskitTextInput> = {};
  // The action passes wire input, so a field may not actually be a string.
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const artistName = text(input.artist_name);
  if (artistName.length < 1) {
    errors.artist_name = 'Artist name is required.';
  } else if (artistName.length > 100) {
    errors.artist_name = 'Artist name must be at most 100 characters.';
  }

  const recipientName = text(input.recipient_name);
  if (recipientName.length < 1) {
    errors.recipient_name = 'Recipient name is required.';
  } else if (recipientName.length > 100) {
    errors.recipient_name = 'Recipient name must be at most 100 characters.';
  }

  if (text(input.recipient_org).length > 100) {
    errors.recipient_org = 'Label / org must be at most 100 characters.';
  }

  const greeting = text(input.greeting);
  if (greeting.length < 1) {
    errors.greeting = 'Greeting is required.';
  } else if (greeting.length > 200) {
    errors.greeting = 'Greeting must be at most 200 characters.';
  }

  const pitch = text(input.pitch);
  if (pitch.length < 1) {
    errors.pitch = 'Please write a sentence or two about why you are a fit.';
  } else if (pitch.length > 2000) {
    errors.pitch = 'This note must be at most 2000 characters.';
  }

  return errors;
}
