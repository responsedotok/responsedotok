import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';
import { getSongAccess } from '@/lib/songs/access';
import { getSongDetail } from '@/lib/songs/get-song-detail';
import { signTrackUrl } from '@/utils/sign-track-url';

export const dynamic = 'force-dynamic';

function formatDuration(ms: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const access = await getSongAccess(id, user?.id ?? null);
  if (!access?.canView) notFound();

  const song = await getSongDetail(id);
  if (!song) notFound();

  // Private blobs need a short-lived signed URL to stream in the browser.
  const tracks = await Promise.all(
    song.tracks.map(async (t) => ({
      ...t,
      playUrl: t.storage_path ? await signTrackUrl(t.storage_path) : null,
    })),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 font-sans">
      <Link
        href="/projects"
        className="text-xs text-text-500 hover:text-text-700"
      >
        ← All projects
      </Link>

      <div className="mt-4 mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="m-0 text-text-200">{song.title}</h1>
          <span className="shrink-0 rounded-full border border-background-300 px-2.5 py-0.5 text-xs text-text-500">
            {song.visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        <p className="m-0 mt-1 text-xs text-text-500">
          by {song.owner_name}
          {song.genre ? ` · ${song.genre}` : ''}
          {access.isOwner ? ' · you own this' : ` · you're a ${access.role}`}
        </p>
        {song.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-text-700">
            {song.description}
          </p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-text-300">
          Tracks{tracks.length ? ` (${tracks.length})` : ''}
        </h2>

        {tracks.length === 0 ? (
          <p className="rounded border border-dashed border-background-300 px-4 py-8 text-center text-sm text-text-500">
            No tracks yet.
            {access.canContribute
              ? ' Upload the first one to get this project going.'
              : ' Check back once a collaborator adds one.'}
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {tracks.map((t) => {
              const dur = formatDuration(t.duration_ms);
              return (
                <li
                  key={t.id}
                  className="rounded border border-background-200 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="m-0 truncate font-medium text-text-900">
                      {t.name}
                    </p>
                    <p className="m-0 shrink-0 text-xs text-text-500">
                      {t.uploader_name ? `added by ${t.uploader_name}` : ''}
                      {dur ? ` · ${dur}` : ''}
                    </p>
                  </div>
                  {t.playUrl ? (
                    <audio
                      controls
                      preload="none"
                      src={t.playUrl}
                      className="mt-2 w-full"
                    >
                      <track kind="captions" />
                    </audio>
                  ) : (
                    <p className="m-0 mt-2 text-xs text-text-400">
                      Audio still processing…
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
