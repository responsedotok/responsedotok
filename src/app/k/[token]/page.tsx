import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getKitByToken } from '@/lib/kits/get-kit-by-token';
import { signTrackUrl } from '@/lib/kits/sign-track-url';
import { RecordView } from '@/app/k/[token]/record-view';

// Always rendered fresh — the token is per-request and the page is uncached.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PresskitPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const kit = await getKitByToken(token);
  if (!kit) notFound();

  // Private blobs need a short-lived signed URL the recipient can stream.
  const tracks = await Promise.all(
    kit.tracks.map(async (track) => ({
      ...track,
      playUrl: await signTrackUrl(track.blob_url),
    })),
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 font-sans">
      <RecordView token={token} />

      <p className="mb-1 text-sm uppercase tracking-wide text-text-500">
        Press kit
        {kit.recipient_org ? ` · for ${kit.recipient_org}` : ''}
      </p>
      <h1 className="mb-8 text-3xl font-semibold text-text-900">
        {kit.artist_name}
      </h1>

      <section className="mb-10 rounded-lg border border-background-200 bg-background-100 p-6">
        <p className="mb-3 text-text-900">{kit.greeting}</p>
        <p className="whitespace-pre-line leading-relaxed text-text-700">
          {kit.pitch}
        </p>
      </section>

      <section className="grid gap-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-500">
          {kit.tracks.length > 1 ? 'Songs' : 'Song'}
        </h2>
        {tracks.map((track) => (
          <div
            key={track.id}
            className="rounded-lg border border-background-200 bg-background-50 p-4"
          >
            <p className="mb-2 truncate text-sm font-medium text-text-800">
              {track.filename}
            </p>
            {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded music has no captions */}
            <audio
              controls
              preload="none"
              className="w-full"
              src={track.playUrl}
            >
              <a href={track.playUrl}>Download {track.filename}</a>
            </audio>
          </div>
        ))}
      </section>
    </main>
  );
}
