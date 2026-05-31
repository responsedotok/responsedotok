import { presskitSchema } from '@/app/(app)/presskit/presskit-schema';
import { sql } from '@/db/pool';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { getUserBySession } from '@/lib/auth/users/get-user-by-session';
import { generatePresskitToken } from '@/lib/presskits/generate-presskit-token';
import type { CreateKitInput } from '@/lib/types/create-kit-input';
import type { CreateKitResult } from '@/lib/types/create-kit-result';

/**
 * Creates a new press kit for the authenticated user.
 * @param input The input data for creating a press kit.
 * @returns The result of the press kit creation, including a token if successful.
 */
export async function createPresskit(
  input: CreateKitInput,
): Promise<CreateKitResult> {
  const sessionToken = await getSessionCookie();
  const user = sessionToken ? await getUserBySession(sessionToken) : null;
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const parsed = presskitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }
  const d = parsed.data;
  const token = generatePresskitToken();

  await sql.begin(async (tx) => {
    const [kit] = await tx<{ id: string }[]>`
      INSERT INTO press_kit
        (owner_id, token, artist_name, recipient_name, recipient_org, greeting, pitch)
      VALUES
        (${user.id}, ${token}, ${d.artist_name}, ${d.recipient_name},
         ${d.recipient_org || null}, ${d.greeting}, ${d.pitch})
      RETURNING id
    `;

    let position = 1;
    for (const t of d.tracks) {
      await tx`
        INSERT INTO press_kit_track
          (kit_id, blob_url, filename, mime_type, size_bytes, position)
        VALUES
          (${kit.id}, ${t.blob_url}, ${t.filename}, ${t.mime_type},
           ${t.size_bytes}, ${position})
      `;
      position++;
    }
  });

  return { ok: true, token };
}
