import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';

export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? '/home' : '/auth/login');
}
