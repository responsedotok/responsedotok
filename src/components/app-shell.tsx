'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/contexts/provider';

const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/home', label: 'Press kits' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {user && (
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 pt-6 font-sans text-xs">
          <nav className="flex items-center gap-4">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? 'font-medium text-text-900'
                      : 'text-text-500 hover:text-text-700'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-baseline gap-2 text-text-500">
            <span>
              Signed in as{' '}
              <span className="text-text-700">{user.display_name}</span>
            </span>
            <span aria-hidden>·</span>
            <button type="button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
