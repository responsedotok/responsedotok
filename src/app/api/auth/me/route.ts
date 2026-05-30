import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/sessions/cookies/clear-session-cookie';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';

import { getUserBySession } from '@/lib/auth/users/get-user-by-session';
import { getPublicUser } from '@/lib/auth/users/get-public-user';

/**
 * Handles fetching the currently authenticated user's public information.
 * @returns The public user information or an authentication error.
 */
export async function GET() {
  const token = await getSessionCookie();
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const user = await getUserBySession(token);
  if (!user) {
    await clearSessionCookie();
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  return NextResponse.json(getPublicUser(user));
}
