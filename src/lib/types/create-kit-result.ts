import type { PresskitTextInput } from '@/lib/presskits/validate-presskit-form';
import type { FieldErrors } from '@/lib/types/field-errors';

export type CreateKitResult =
  | { ok: true; token: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors<PresskitTextInput> };
