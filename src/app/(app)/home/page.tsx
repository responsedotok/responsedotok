import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';
import { listKitsForUser } from '@/lib/kits/list-kits-for-user';
import { CopyLinkButton } from '@/app/(app)/home/copy-link-button';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default async function HomePage() {
  const user = await getCurrentUser();
  const kits = user ? await listKitsForUser(user.id) : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 font-sans">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-900">
          Your press kits
        </h1>
        <Link
          href="/create"
          className="rounded bg-primary-700 px-4 py-2 text-sm font-medium text-text-50 hover:bg-primary-600"
        >
          New press kit
        </Link>
      </div>

      {kits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-background-300 p-8 text-center text-text-500">
          No press kits yet. Create one and send the private link to a label.
        </p>
      ) : (
        <ul className="grid gap-3">
          {kits.map((kit) => (
            <li
              key={kit.token}
              className="flex items-center justify-between gap-4 rounded-lg border border-background-200 bg-background-100 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text-900">
                  {kit.recipient_name}
                  {kit.recipient_org ? (
                    <span className="text-text-500">
                      {' '}
                      · {kit.recipient_org}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-text-500">
                  Created {dateFmt.format(new Date(kit.created_at))}
                  {' · '}
                  <span
                    className={kit.view_count > 0 ? 'text-primary-600' : ''}
                  >
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
      )}
    </main>
  );
}
