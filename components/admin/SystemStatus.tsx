'use client';

import { useEffect, useState } from 'react';

interface StatusPayload {
  ok: boolean;
  env: { ok: boolean; errors: string[] };
  config: {
    demoMode: boolean;
    imageModel: string;
    textModel: string;
    hasMongo: boolean;
    hasGemini: boolean;
    hasGcs: boolean;
  };
  game: {
    phase: string;
    matchId: string | null;
    referencePending: boolean;
  };
}

export function SystemStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    fetch('/api/admin/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const items = [
    ['Env', status.env.ok ? 'OK' : 'ERR'],
    ['Mongo', status.config.hasMongo ? 'OK' : 'ERR'],
    ['Gemini', status.config.hasGemini || status.config.demoMode ? 'OK' : 'ERR'],
    ['GCS', status.config.hasGcs || status.config.demoMode ? 'OK' : 'ERR'],
    ['Phase', status.game.phase]
  ];

  return (
    <section className="q-card-soft p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="q-label">System</h3>
        <span className={status.env.ok ? 'text-xs text-primary' : 'text-xs text-danger'}>
          {status.env.ok ? 'READY' : 'CHECK'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-ink-variant">{label}</span>
            <span className="font-semibold text-ink truncate">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-light truncate">
        {status.config.imageModel} / {status.config.textModel}
      </p>
      {!status.env.ok && (
        <p className="mt-2 text-xs text-danger truncate">{status.env.errors.join(' / ')}</p>
      )}
    </section>
  );
}
