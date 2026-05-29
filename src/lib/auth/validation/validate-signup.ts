import { USERNAME_PATTERN, EMAIL_PATTERN } from '@/lib/constants/constants';
import type { SignupInput } from '@/lib/types/signup-input';
import type { FieldErrors } from '@/lib/types/field-errors';

/**
 * Validates the signup input fields.
 * @param input The signup input to validate.
 * @returns An object containing field errors, if any.
 */
export function validateSignup(input: SignupInput): FieldErrors<SignupInput> {
  const errors: FieldErrors<SignupInput> = {};

  if (!USERNAME_PATTERN.test(input.username)) {
    errors.username =
      'Username must be 3–32 characters: letters, numbers, or underscore (no spaces).';
  }
  if (!EMAIL_PATTERN.test(input.email) || input.email.length > 320) {
    errors.email = 'Enter a valid email address.';
  }
  if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (input.password.length > 256) {
    errors.password = 'Password must be at most 256 characters.';
  }
  if (input.display_name.length < 1) {
    errors.display_name = 'Display name is required.';
  } else if (input.display_name.length > 100) {
    errors.display_name = 'Display name must be at most 100 characters.';
  }

  return errors;
}
