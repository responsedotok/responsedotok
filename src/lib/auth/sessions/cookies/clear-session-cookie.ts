import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../constants/constants';

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: '/' });
}
