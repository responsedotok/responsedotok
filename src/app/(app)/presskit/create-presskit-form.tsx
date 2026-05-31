'use client';

import { upload } from '@vercel/blob/client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { createPresskit } from '@/app/(app)/presskit/create-presskit';
import type { Phase } from '@/lib/types/phase';

export function CreatePresskitForm({
  defaultArtist,
}: {
  defaultArtist: string;
}) {
  const [phase, setPhase] = useState<Phase>('editing');
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;

    const fd = new FormData(form);

    const files = (fd.getAll('songs') as File[]).filter((f) => f.size > 0);

    if (files.length < 1 || files.length > 2) {
      setError('There is a 1 - 2 song upload limit for presskits.');
      return;
    }

    try {
      setPhase('uploading');
      const tracks = [];
      for (const f of files) {
        const blob = await upload(f.name, f, {
          access: 'private',
          handleUploadUrl: '/api/presskits/upload',
          contentType: f.type || undefined,
        });
        tracks.push({
          blob_url: blob.url,
          filename: f.name,
          mime_type: blob.contentType || f.type || 'application/octet-stream',
          size_bytes: f.size,
        });
      }
      setPhase('saving');
      const res = await createPresskit({
        artist_name: String(fd.get('artist_name') ?? ''),
        recipient_name: String(fd.get('recipient_name') ?? ''),
        recipient_org: String(fd.get('recipient_org') ?? ''),
        greeting: String(fd.get('greeting') ?? ''),
        pitch: String(fd.get('pitch') ?? ''),
        tracks,
      });

      if (!res.ok) {
        setError('Failed to create presskit.');
        setPhase('editing');
        return;
      }

      setShareUrl(`${window.location.origin}/presskit/${res.token}`);
      setPhase('done');
    } catch (err) {
      setError(
        (err as Error).message ||
          'Creating presskit failed on unknown exception. Try again.',
      );
      setPhase('editing');
    }
  }

  if (phase === 'done' && shareUrl) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 font-sans">
        <h1 className="mb-3 text-2xl font-semibold text-text-900">
          Your presskit has been created!
        </h1>

        <p className="mb-6 text-text-600">
          Send this private link to the label. Only people with the link can
          open it.
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-background-300 bg-background-100 p-3">
          <code className="flex-1 truncate font-mono text-sm text-text-900">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
            }}
            className="rounded bg-primary-700 px-3 py-1.5 text-sm font-medium text-text-50 hover:bg-primary-600"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex gap-4 text-sm">
          <Link
            href={shareUrl}
            className="text-primary-600 hover:text-primary-500"
          >
            Preview
          </Link>
          <Link
            href="/home"
            className="text-primary-600 hover:text-primary-500"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const busy = phase === 'uploading' || phase === 'saving';

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 font-sans">
      <h1 className="mb-2 text-2xl font-semibold text-text-900">
        New press kit
      </h1>
      <p className="mb-8 text-text-600">
        Enter a note for the recipient. Then upload a song or two, and send it.
      </p>

      <form ref={formRef} onSubmit={onSubmit} className="grid gap-5" noValidate>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">Artist name</span>
          <input
            name="artist_name"
            defaultValue={defaultArtist}
            required
            maxLength={100}
            className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 focus:border-primary-500 focus:outline-none"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-text-800">
              Recipient name
            </span>
            <input
              name="recipient_name"
              placeholder="e.g. Jordan at XL"
              required
              maxLength={100}
              className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-text-800">
              Label / org{' '}
              <span className="font-normal text-text-400">(optional)</span>
            </span>
            <input
              name="recipient_org"
              placeholder="e.g. XL Recordings"
              maxLength={100}
              className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">Greeting</span>
          <input
            name="greeting"
            placeholder="Hi Jordan,"
            required
            maxLength={200}
            className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">
            Why you&apos;re a fit
          </span>
          <textarea
            name="pitch"
            placeholder="A couple of sentences on why this is right for them."
            required
            maxLength={2000}
            rows={5}
            className="w-full resize-y rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">
            Songs <span className="font-normal text-text-400">(1–2)</span>
          </span>
          <input
            name="songs"
            type="file"
            accept="audio/*"
            multiple
            required
            className="text-sm text-text-700 file:mr-3 file:rounded file:border-0 file:bg-background-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text-800 hover:file:bg-background-300"
          />
        </label>

        {error && <p className="text-sm text-secondary-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 justify-self-start rounded bg-primary-700 px-5 py-2 text-sm font-medium text-text-50 hover:bg-primary-600 disabled:opacity-60"
        >
          {phase === 'uploading'
            ? 'Uploading songs…'
            : phase === 'saving'
              ? 'Generating link…'
              : 'Generate press kit'}
        </button>
      </form>
    </main>
  );
}
