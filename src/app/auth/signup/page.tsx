'use client';

import Link from 'next/link';
import { AuthDevPanel } from '@/app/auth/auth-dev-panel';
import { Field } from '@/app/auth/field';
import { useSignup } from '@/app/auth/hooks/use-signup';
import { USERNAME_PATTERN } from '@/lib/constants/constants';

const isDev = process.env.NODE_ENV === 'development';

export default function SignupPage() {
  const {
    onSubmit: onSignup,
    errors: signupErrors,
    serverError: signupServerError,
  } = useSignup();

  return (
    <div className="font-sans">
      <header className="mb-8 font-sans">
        <h1 className="whitespace-nowrap text-3xl font-semibold text-text-800">
          Create an account
        </h1>
        <p className="max-w-xs leading-relaxed text-text-800">
          Share the private link & let your work speak.
        </p>
      </header>

      <form onSubmit={onSignup} className="grid gap-5" noValidate>
        <Field
          name="username"
          placeholder="username"
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
          placeholder="password"
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

      <p className="mt-8 font-sans text-sm text-text-500">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Log in
        </Link>
      </p>

      {isDev && <AuthDevPanel />}
    </div>
  );
}
