import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/home');

  return <>{children}</>;
}
