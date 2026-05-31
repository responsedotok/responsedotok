'use client';

import Link from 'next/link';
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
      <header className="border-b border-background-200 bg-background-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/home"
            className="font-sans text-lg font-bold text-text-900"
          >
            response.ok
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-700">{user.display_name}</span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded border border-background-300 px-3 py-1 text-text-800 hover:bg-background-200"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
