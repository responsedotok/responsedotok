import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { sql } from '@/db/pool';
import { signupSchema } from '@/lib/auth/schemas/signup-schema';
import { setSessionCookie } from '@/lib/auth/sessions/cookies/set-session-cookie';
import { createSession } from '@/lib/auth/sessions/create-session';
import { getPublicUser } from '@/lib/auth/users/get-public-user';
import type { PublicUserRow } from '@/lib/types/public-user-row';

/**
 * Handles user signup.
 * @param req The incoming request
 * @returns The created public user
 */
export async function POST(req: Request) {
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid signup details' },
      { status: 400 },
    );
  }

  const username = parsed.data.username.toLowerCase();
  const email = parsed.data.email.toLowerCase();
  const displayName = parsed.data.display_name;
  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id,
  });

  try {
    const user = await sql.begin(async (tx) => {
      const [row] = await tx<PublicUserRow[]>`
        INSERT INTO "user" (username, email, display_name)
        VALUES (${username}, ${email}, ${displayName})
        RETURNING id, username, email, display_name,
                  avatar_url, bio, created_at
      `;
      await tx`
        INSERT INTO password_credential (user_id, password_hash)
        VALUES (${row.id}, ${passwordHash})
      `;
      return row;
    });

    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json(getPublicUser(user), { status: 201 });
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === '23505') {
      const field =
        err.constraint_name === 'user_email_uq' ? 'email' : 'username';
      return NextResponse.json(
        { error: `The ${field} is already in use` },
        { status: 409 },
      );
    }
    throw err;
  }
}
