'use client';

import { useState } from 'react';

/**
 * Composes the absolute share URL on the client and copies it to the clipboard.
 * @param param0 token [string] The token to be included in the share URL.
 * @returns void
 */
export function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(
          `${window.location.origin}/k/${token}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded border border-background-300 px-2.5 py-1 text-xs font-medium text-text-700 hover:bg-background-200"
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
