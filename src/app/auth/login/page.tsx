'use client';

import Link from 'next/link';
import { AuthDevPanel } from '@/app/auth/auth-dev-panel';
import { Field } from '@/app/auth/field';
import { useLogin } from '../hooks/use-login';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const { onSubmit: onLogin, loginErrors, loginServerError } = useLogin();

  return (
    <>
      <section className="mb-8 p-4 font-sans max-w-sm w-full h-full mx-auto">
        <h1 className="mb-8 text-text-200">Log In</h1>

        <form onSubmit={onLogin} className="grid gap-8 mb-12" noValidate>
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
          <button type="submit" className="mb-4">
            Log in
          </button>
        </form>

        <p className="text-sm text-text-500">
          Need an account?{' '}
          <Link
            href="/auth/signup"
            className="text-primary-600 hover:text-primary-500"
          >
            Sign up
          </Link>
        </p>
      </section>
      {isDev && <AuthDevPanel />}
    </>
  );
}
