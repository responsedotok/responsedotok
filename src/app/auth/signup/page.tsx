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
    <>
      <section className="mb-8 font-sans max-w-sm w-full h-full mx-auto">
        <h1 className="whitespace-nowrap text-left mb-8 text-text-200 tracking-tightest">
          Create an account
        </h1>
        <p className="mb-4 text-text-200">
          Signup to generate presskits for your music.
        </p>

        <form onSubmit={onSignup} className="grid gap-5 mb-12" noValidate>
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
          <button type="submit" className="mb-4">
            Create account
          </button>
        </form>

        <p className="text-sm text-text-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary-600 hover:text-primary-500"
          >
            Log in
          </Link>
        </p>
      </section>
      {isDev && <AuthDevPanel />}
    </>
  );
}
