'use client';

import Link from 'next/link';
import { AuthDevPanel } from '@/app/auth/auth-dev-panel';
import { Field } from '@/app/auth/field';
import { useLogin } from '../hooks/use-login';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const { onSubmit: onLogin, loginErrors, loginServerError } = useLogin();

  return (
    <div className="font-sans">
      <header className="mb-8 font-sans">
        <h1 className="whitespace-nowrap text-3xl font-semibold text-text-800">
          Welcome back
        </h1>
        <p className="max-w-sm leading-relaxed text-text-800">
         Share the private link & let your work speak.
        </p>
      </header>

      <form onSubmit={onLogin} className="grid gap-5" noValidate>
        <Field
          name="identifier"
          placeholder="username or email"
          autoComplete="username"
          error={loginErrors.identifier}
        />
        <Field
          name="password"
          type="password"
          placeholder="password"
          autoComplete="current-password"
          error={loginErrors.password}
        />
        {loginServerError && (
          <p className="text-sm text-secondary-600">{loginServerError}</p>
        )}
        <button
          type="submit"
          className="mt-1 rounded bg-primary-700 px-4 py-2 text-sm font-medium text-text-50 hover:bg-primary-600"
        >
          Log in
        </button>
      </form>

      <p className="mt-8 font-sans text-sm text-text-500">
        Need an account?{' '}
        <Link
          href="/auth/signup"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign up
        </Link>
      </p>

      {isDev && <AuthDevPanel />}
    </div>
  );
}
