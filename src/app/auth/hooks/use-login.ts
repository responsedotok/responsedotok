import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/contexts/provider';
import { validateLogin } from '@/lib/auth/validation/validate-login';
import type { FieldErrors } from '@/lib/types/field-errors';
import type { LoginInput } from '@/lib/types/login-input';
import { msgFromBody } from '@/utils/msg-from-body';

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginErrors, setLoginErrors] = useState<FieldErrors<LoginInput>>({});
  const [loginServerError, setLoginServerError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoginServerError(null);

      const f = new FormData(e.currentTarget);
      const input: LoginInput = {
        identifier: String(f.get('identifier') ?? '').trim(),
        password: String(f.get('password') ?? ''),
      };

      const errors = validateLogin(input);
      setLoginErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const res = await login(input);
      if (res.ok) {
        router.push('/home');
        return;
      }
      setLoginServerError(msgFromBody(res.body) ?? 'Invalid credentials.');
    },
    [login, router],
  );

  return { onSubmit, loginErrors, loginServerError };
}
