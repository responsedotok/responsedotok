import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/sessions/cookies/get-session-cookie';
import { getUserBySession } from '@/lib/auth/users/get-user-by-session';

const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB per track

/**
 * Issues a short-lived client-upload token so the browser can PUT the audio
 * file straight to Vercel Blob (bypass function limits).
 * onUploadCompleted is intentionally unused — the DB rows are written by the
 * createPressKit server action, which also works in local dev where Vercel
 * can't call back to localhost.
 * @param req The incoming request
 * @returns The result of the handleUpload function
 */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async () => {
        const sessionToken = await getSessionCookie();
        const user = sessionToken
          ? await getUserBySession(sessionToken)
          : null;
        if (!user) throw new Error('You must be signed in to upload.');

        return {
          allowedContentTypes: AUDIO_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: user.id,
        };
      },
      onUploadCompleted: async () => {
        // no-op (see note above)
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
