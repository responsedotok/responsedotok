'use client';

import { useAuth } from '@/lib/auth/contexts/provider';

export function AuthDevPanel() {
  const { lastCall } = useAuth();
  if (!lastCall) return null;

  return (
    <section className="rounded-lg border border-accent-300 bg-accent-100 p-4">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-accent-700">
          Dev · last response
        </h2>
        <span className="font-mono text-xs text-text-500">
          {lastCall.label}
        </span>
      </div>
      <div className="mb-2 font-mono text-sm text-text-900">
        Status: <span className="font-semibold">{lastCall.status}</span>
      </div>
      <pre className="max-h-64 overflow-auto rounded bg-background-100 p-3 font-mono text-xs text-text-900">
        {JSON.stringify(lastCall.body, null, 2)}
      </pre>
    </section>
  );
}
