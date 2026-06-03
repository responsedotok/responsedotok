import { issueSignedToken, presignUrl } from '@vercel/blob';
import { DEFAULT_TTL_MS } from '@/lib/constants/constants';

/**
 * Signs a track URL with a short-lived presigned GET URL.
 * @param blobUrl The URL of the blob to sign.
 * @param ttlMs The time-to-live of the signed URL in milliseconds.
 * @returns A promise that resolves to the signed URL.
 */
export async function signTrackUrl(
  blobUrl: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<string> {
  const pathname = new URL(blobUrl).pathname.replace(/^\/+/, '');
  const validUntil = Date.now() + ttlMs;

  const token = await issueSignedToken({
    pathname,
    operations: ['get'],
    validUntil,
  });

  const { presignedUrl } = await presignUrl(
    {
      clientSigningToken: token.clientSigningToken,
      delegationToken: token.delegationToken,
    },
    {
      operation: 'get',
      pathname,
      validUntil: token.validUntil,
      access: 'private',
    },
  );

  return presignedUrl;
}
