import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../constants/constants';

/**
 * Sets the session cookie with the specified token and expiration date.
 * @param token The session token.
 * @param expiresAt The expiration date of the session cookie.
 */
export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}
