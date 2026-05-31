import { redirect } from 'next/navigation';
import LogoImage from '@/components/logo-image';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/home');

  return (
    <div className="grid min-h-dvh lg:grid-cols-5">
      {/* Brand panel — colored backing so the white logo reads */}
      <aside className="relative hidden overflow-hidden bg-primary-700 p-12 lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
        <h2 className="font-sans text-sm uppercase tracking-[0.2rem] text-primary-200">
          response.ok
        </h2>

        <div className="flex flex-1 items-center justify-center">
          <LogoImage className="w-2/3 max-w-xs select-none" />
        </div>

        <h3 className="max-w-sm text-primary-200 leading-relaxed">
          Presskits for musicians.
        </h3>
        <p className="max-w-xs leading-relaxed text-primary-200">
          Share the private link & let your work speak.
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-col items-center justify-center px-6 py-12 lg:col-span-3">
        <div className="flex w-full max-w-sm flex-col">
          {/* Compact logo for small screens, where the brand panel is hidden */}
          <div className="mb-10 flex w-fit items-center justify-center rounded-xl bg-primary-700 p-3 lg:hidden">
            <LogoImage className="w-10 select-none" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
