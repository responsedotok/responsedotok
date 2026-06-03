import Link from 'next/link';
import { CopyLinkButton } from '@/app/(app)/_utils/copy-link-button';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';
import { listPresskitsForUser } from '@/lib/presskits/list-presskits-for-user';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default async function HomePage() {
  const user = await getCurrentUser();
  const kits = user ? await listPresskitsForUser(user.id) : [];

  if (kits.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl flex flex-1 flex-col items-center justify-center font-sans px-6 py-24">
        <h1 className="m-0 text-text-200">Your first press kit</h1>
        <p className="mt-5 max-w-md text-text-500">
          A press kit is a private page you send to a label — your music, your
          story and your links, all in one place. Make one and share the link.
        </p>
        <Link href="/create" className="mt-8">
          <button type="submit">Create a press kit</button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-dvw flex-1 px-6 py-16">
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-text-200">Your press kits</h2>
        <Link
          href="/create"
          className="rounded bg-primary-700 px-4 py-2 text-sm font-medium text-text-200 hover:bg-primary-600"
        >
          New press kit
        </Link>
      </div>

      <ul className="m-0 grid list-none gap-0 p-0">
        {kits.map((kit) => (
          <li
            key={kit.token}
            className="flex items-center justify-between gap-4 border-t border-background-200 py-4 last:border-b"
          >
            <div className="min-w-0">
              <p className="m-0 truncate font-medium text-text-900">
                {kit.recipient_name}
                {kit.recipient_org ? (
                  <span className="text-text-500"> · {kit.recipient_org}</span>
                ) : null}
              </p>
              <p className="m-0 mt-0.5 text-xs text-text-500">
                Created {dateFmt.format(new Date(kit.created_at))}
                {' · '}
                <span className={kit.view_count > 0 ? 'text-primary-600' : ''}>
                  {kit.view_count === 0
                    ? 'Not opened yet'
                    : `Opened ${kit.view_count}×`}
                </span>
                {kit.last_viewed_at
                  ? ` · last ${dateFmt.format(new Date(kit.last_viewed_at))}`
                  : ''}
                {kit.revoked_at ? ' · revoked' : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CopyLinkButton token={kit.token} />
              <Link
                href={`/k/${kit.token}`}
                className="rounded border border-background-300 px-2.5 py-1 text-xs font-medium text-text-700 hover:bg-background-200"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
