'use server';

import { songSchema } from '@/app/(app)/_schemas/song-schema';
import { sql } from '@/db/pool';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { getUserBySession } from '@/lib/auth/users/get-user-by-session';
import { validateSongForm } from '@/lib/songs/validate-song-form';
import type { CreateSongInput } from '@/lib/types/create-song-input';
import type { CreateSongResult } from '@/lib/types/create-song-result';

/**
 * Creates a new project (song) for the authenticated user, bootstrapping the
 * lean model: one default 'main' branch and one initial working version. The
 * branch/version graph is invisible in the UI but is what tracks attach to.
 * @param input The project fields from the form.
 * @returns The created project's id, or field/form errors.
 */
export async function createSong(
  input: CreateSongInput,
): Promise<CreateSongResult> {
  const sessionToken = await getSessionCookie();
  const user = sessionToken ? await getUserBySession(sessionToken) : null;
  if (!user) return { ok: false, error: 'You must be signed in.' };

  if (input === null || typeof input !== 'object') {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const fieldErrors = validateSongForm(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const parsed = songSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }
  const d = parsed.data;

  const songId = await sql.begin(async (tx) => {
    const [song] = await tx<{ id: string }[]>`
      INSERT INTO song (title, owner_id, visibility, genre, description)
      VALUES (
        ${d.title}, ${user.id}, ${d.visibility},
        ${d.genre || null}, ${d.description || null}
      )
      RETURNING id
    `;

    const [branch] = await tx<{ id: string }[]>`
      INSERT INTO branch (song_id, name, is_default, created_by)
      VALUES (${song.id}, 'main', true, ${user.id})
      RETURNING id
    `;

    await tx`
      INSERT INTO version (branch_id, created_by, label)
      VALUES (${branch.id}, ${user.id}, 'Initial version')
    `;

    return song.id;
  });

  return { ok: true, songId };
}
