'use client';

import Link from 'next/link';
import { USERNAME_PATTERN } from '@/lib/constants/constants';
import { AuthDevPanel } from '@/app/auth/auth-dev-panel';
import { Field } from '@/app/auth/field';
import { useSignup } from '@/app/auth/hooks/use-signup';

const isDev = process.env.NODE_ENV === 'development';

export default function SignupPage() {
  const {
    onSubmit: onSignup,
    errors: signupErrors,
    serverError: signupServerError,
  } = useSignup();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 font-sans">
      <h1 className="mb-8 text-2xl font-semibold text-text-900">Sign up</h1>

      <section className="mb-8 rounded-lg border border-background-200 bg-background-100 p-4">
        <form onSubmit={onSignup} className="grid gap-3" noValidate>
          <Field
            name="username"
            placeholder="username (3–32, letters/numbers/_)"
            pattern={USERNAME_PATTERN.source}
            minLength={3}
            maxLength={32}
            autoComplete="username"
            error={signupErrors.username}
          />
          <Field
            name="email"
            type="email"
            placeholder="email"
            maxLength={320}
            autoComplete="email"
            error={signupErrors.email}
          />
          <Field
            name="password"
            type="password"
            placeholder="password (min 8)"
            minLength={8}
            maxLength={256}
            autoComplete="new-password"
            error={signupErrors.password}
          />
          <Field
            name="display_name"
            placeholder="display name"
            minLength={1}
            maxLength={100}
            error={signupErrors.display_name}
          />
          {signupServerError && (
            <p className="text-sm text-secondary-600">{signupServerError}</p>
          )}
          <button
            type="submit"
            className="mt-1 rounded bg-primary-700 px-4 py-2 text-sm font-medium text-text-50 hover:bg-primary-600"
          >
            Create account
          </button>
        </form>
      </section>

      <p className="text-sm text-text-500">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="text-primary-600 hover:text-primary-500"
        >
          Log in
        </Link>
      </p>

      {isDev && <AuthDevPanel />}
    </main>
  );
}
