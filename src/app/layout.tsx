import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Crimson_Pro, SUSE } from 'next/font/google';
import './globals.css';
import { getCurrentUser } from '@/lib/auth//users/get-current-user';
import { AuthProvider } from '@/lib/auth/contexts/provider';

const suseSans = SUSE({
  variable: '--font-suse-sans',
  subsets: ['latin'],
});

const crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'A website called responsedotok.com',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${suseSans.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <Analytics />
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
