'use client';

import { useEffect, useRef } from 'react';
import { recordView } from '@/db/record-view';

// Fires once on mount to log that the recipient opened the link. Done
// client-side (not during render) so route prefetches don't inflate counts.
export function RecordView({ token }: { token: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void recordView(token);
  }, [token]);
  return null;
}
