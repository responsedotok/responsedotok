import { cache } from 'react';
import type { PublicUser } from '@/lib/types/public-user';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { getUserBySession } from './get-user-by-session';
import { getPublicUser } from './get-public-user';

/**
 * Retrieves the currently authenticated user as a public user object.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = await getSessionCookie();
  if (!token) return null;

  const user = await getUserBySession(token);
  return user ? getPublicUser(user) : null;
});
