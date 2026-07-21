import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';
import { listSongsForUser } from '@/lib/songs/list-songs-for-user';

export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const songs = user ? await listSongsForUser(user.id) : [];

  if (songs.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 font-sans">
        <h1 className="m-0 text-text-200">Start your first project</h1>
        <p className="mt-5 max-w-md text-center text-text-500">
          A project is a song in progress. Upload a track, invite others, and
          build it together — one contribution at a time.
        </p>
        <Link
          href="/projects/new"
          className="mt-10 rounded bg-primary-700 px-5 py-2.5 text-sm font-medium text-text-200 hover:bg-primary-600"
        >
          Create a project
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 font-sans">
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-text-200">Your projects</h2>
        <Link
          href="/projects/new"
          className="rounded bg-primary-700 px-4 py-2 text-sm font-medium text-text-200 hover:bg-primary-600"
        >
          New project
        </Link>
      </div>

      <ul className="m-0 grid list-none gap-0 p-0">
        {songs.map((song) => (
          <li
            key={song.id}
            className="flex items-center justify-between gap-4 border-t border-background-200 py-4 last:border-b"
          >
            <div className="min-w-0">
              <Link
                href={`/projects/${song.id}`}
                className="m-0 block truncate font-medium text-text-900 hover:text-primary-600"
              >
                {song.title}
              </Link>
              <p className="m-0 mt-0.5 text-xs text-text-500">
                {song.is_owner ? 'Owner' : 'Collaborator'}
                {song.genre ? ` · ${song.genre}` : ''}
                {` · ${song.track_count} ${song.track_count === 1 ? 'track' : 'tracks'}`}
                {song.visibility === 'public' ? ' · public' : ''}
                {` · updated ${dateFmt.format(new Date(song.updated_at))}`}
              </p>
            </div>
            <Link
              href={`/projects/${song.id}`}
              className="shrink-0 rounded border border-background-300 px-2.5 py-1 text-xs font-medium text-text-700 hover:bg-background-200"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
