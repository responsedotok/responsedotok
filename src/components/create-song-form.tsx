'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSong } from '@/app/(app)/_utils/create-song';
import {
  type SongTextInput,
  validateSongForm,
} from '@/lib/songs/validate-song-form';
import type { FieldErrors } from '@/lib/types/field-errors';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-secondary-600">{message}</p>;
}

export function CreateSongForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SongTextInput>>(
    {},
  );

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const input = {
      title: String(fd.get('title') ?? ''),
      genre: String(fd.get('genre') ?? ''),
      description: String(fd.get('description') ?? ''),
      visibility:
        fd.get('visibility') === 'public'
          ? ('public' as const)
          : ('private' as const),
    };

    const errors = validateSongForm(input);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      const res = await createSong(input);
      if (!res.ok) {
        setError(res.error || 'Failed to create the project.');
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setSaving(false);
        return;
      }
      router.push(`/projects/${res.songId}`);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Try again.');
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 font-sans">
      <h1 className="mt-0 mb-2 text-text-200">New project</h1>
      <p className="mb-8 text-text-500">
        Start a project, then upload your first track and invite others to add
        theirs.
      </p>

      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">Title</span>
          <input
            name="title"
            placeholder="e.g. Midnight Drive"
            required
            maxLength={200}
            aria-invalid={fieldErrors.title ? 'true' : undefined}
            className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
          />
          <FieldError message={fieldErrors.title} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">
            Genre <span className="font-normal text-text-400">(optional)</span>
          </span>
          <input
            name="genre"
            placeholder="e.g. Synthwave"
            maxLength={50}
            aria-invalid={fieldErrors.genre ? 'true' : undefined}
            className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
          />
          <FieldError message={fieldErrors.genre} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">
            Description{' '}
            <span className="font-normal text-text-400">(optional)</span>
          </span>
          <textarea
            name="description"
            placeholder="What are you going for? What kind of contributions are you after?"
            maxLength={5000}
            rows={4}
            aria-invalid={fieldErrors.description ? 'true' : undefined}
            className="w-full resize-y rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:border-primary-500 focus:outline-none"
          />
          <FieldError message={fieldErrors.description} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-text-800">Visibility</span>
          <select
            name="visibility"
            defaultValue="private"
            className="w-full rounded border border-background-300 bg-background-50 px-3 py-2 text-sm text-text-900 focus:border-primary-500 focus:outline-none"
          >
            <option value="private">
              Private — only you and collaborators
            </option>
            <option value="public">Public — anyone can find and listen</option>
          </select>
        </label>

        {error && <p className="text-sm text-secondary-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 justify-self-start rounded bg-primary-700 px-5 py-2 text-sm font-medium text-text-200 hover:bg-primary-600 disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create project'}
        </button>
      </form>
    </main>
  );
}
