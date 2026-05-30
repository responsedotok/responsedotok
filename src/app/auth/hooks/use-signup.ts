import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { msgFromBody } from '@/utils/msg-from-body';
import { useAuth } from '@/lib/auth/contexts/provider';
import { validateSignup } from '@/lib/auth/validation/validate-signup';
import type { FieldErrors } from '@/lib/types/field-errors';
import type { SignupInput } from '@/lib/types/signup-input';

export function useSignup() {
  const { signup } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<SignupInput>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setServerError(null);

      const f = new FormData(e.currentTarget);
      const input: SignupInput = {
        username: String(f.get('username') ?? '').trim(),
        email: String(f.get('email') ?? '').trim(),
        password: String(f.get('password') ?? ''),
        display_name: String(f.get('display_name') ?? '').trim(),
      };

      const v = validateSignup(input);
      setErrors(v);
      if (Object.keys(v).length > 0) return;

      const res = await signup(input);
      if (res.ok) {
        router.push('/home');
        return;
      }
      setServerError(
        msgFromBody(res.body) ?? 'Something went wrong. Try again.',
      );
    },
    [signup, router],
  );

  return { onSubmit, errors, serverError };
}
