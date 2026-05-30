'use client';

import Link from 'next/link';
import { AuthDevPanel } from '@/app/auth/auth-dev-panel';
import { Field } from '@/app/auth/field';
import { useLogin } from '../hooks/use-login';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const { onSubmit: onLogin, loginErrors, loginServerError } = useLogin();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 font-sans">
      <h1 className="mb-8 text-2xl font-semibold text-text-900">Log in</h1>

      <section className="mb-8 rounded-lg border border-background-200 bg-background-100 p-4">
        <form onSubmit={onLogin} className="grid gap-3" noValidate>
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
      </section>

      <p className="text-sm text-text-500">
        Need an account?{' '}
        <Link
          href="/auth/signup"
          className="text-primary-600 hover:text-primary-500"
        >
          Sign up
        </Link>
      </p>

      {isDev && <AuthDevPanel />}
    </main>
  );
}
