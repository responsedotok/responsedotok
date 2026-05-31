import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../constants/constants';

/**
 * Retrieves the value of the session cookie.
 * @returns The session token if found, otherwise undefined.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
