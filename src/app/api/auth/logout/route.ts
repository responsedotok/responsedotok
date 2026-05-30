import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/sessions/cookies/clear-session-cookie';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { deleteSession } from '@/lib/auth/sessions/delete-session';

/**
 * Handles user logout by clearing the session cookie and deleting the session.
 * @returns A JSON response indicating the logout status.
 */
export async function POST() {
  const token = await getSessionCookie();
  if (token) await deleteSession(token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
