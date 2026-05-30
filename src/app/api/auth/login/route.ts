import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth/sessions/cookies/set-session-cookie';
import { loginSchema } from '@/lib/auth/schemas/login-schema';
import { createSession } from '@/lib/auth/sessions/create-session';
import {
  type PasswordRow,
} from '@/lib/types/password-row';
import { sql } from '@/db/pool';
import type { 
  PublicUserRow
} from '@/lib/types/public-user-row';
import { getPublicUser } from '@/lib/auth/users/get-public-user';

/**
 * Handles user login.
 * @param req The incoming request
 * @returns The public user information or an authentication error.
 */
export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const identifier = parsed.data.identifier.toLowerCase();

  const [row] = await sql<(PublicUserRow & PasswordRow)[]>`
    SELECT
      u.id, u.username, u.email, u.display_name,
      u.avatar_url, u.bio, u.created_at,
      pc.user_id, pc.password_hash
    FROM "user" u
    JOIN password_credential pc ON pc.user_id = u.id
    WHERE (u.username = ${identifier} OR u.email = ${identifier})
      AND u.deleted_at IS NULL
    LIMIT 1
  `;

  const valid =
    row !== undefined &&
    (await argon2.verify(row.password_hash, parsed.data.password));

  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = await createSession(row.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json(getPublicUser(row));
}
