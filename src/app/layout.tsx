import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Crimson_Pro, Fira_Code, SUSE } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
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

const firaMono = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'responsedotok',
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
      className={`${suseSans.variable} ${crimsonPro.variable} ${firaMono.variable} h-full antialiased`}
    >
      <Analytics />
      <SpeedInsights />
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
