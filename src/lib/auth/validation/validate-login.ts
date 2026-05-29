import type { LoginInput } from '@/lib/types/login-input';
import type { FieldErrors } from '@/lib/types/field-errors';

/**
 * Validates the login input fields.
 * @param input The login input to validate.
 * @returns An object containing field errors, if any.
 */
export function validateLogin(input: LoginInput): FieldErrors<LoginInput> {
  const errors: FieldErrors<LoginInput> = {};

  if (input.identifier.length < 3 || input.identifier.length > 320) {
    errors.identifier = 'Enter your username or email.';
  }
  if (input.password.length < 1) {
    errors.password = 'Password is required.';
  }

  return errors;
}
