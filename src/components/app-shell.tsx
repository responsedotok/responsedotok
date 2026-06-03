'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/contexts/provider';

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {user && (
        <div className="mx-auto flex w-full max-w-5xl items-baseline justify-end gap-2 px-6 pt-6 font-sans text-xs text-text-500">
          <span>
            Signed in as{' '}
            <span className="text-text-700">{user.display_name}</span>
          </span>
          <span aria-hidden>·</span>
          <div>
            <button type="button" onClick={onLogout} className="">
              Log out
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
