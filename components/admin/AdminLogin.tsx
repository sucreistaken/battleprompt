'use client';

import { useState } from 'react';

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    setBusy(false);
    if (res.ok) {
      onSuccess();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setErr(body.reason === 'locked' ? 'Too many attempts — locked' : 'Wrong password');
  }

  return (
    <main className="min-h-screen bg-cream text-navy grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="bg-navy text-cream px-5 py-3 flex items-center justify-between">
          <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase">
            <span className="live-dot mr-2" />
            CONTROL ROOM
          </span>
          <span className="font-display italic font-black text-base">PROMPT CLASH</span>
        </div>

        <div className="border-2 border-navy border-t-0 p-6 bg-cream">
          <div className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-tangerine">
            Restricted Access
          </div>
          <h1 className="mt-2 font-display italic font-black text-4xl text-navy leading-tight">
            Sign in
          </h1>

          <label className="block mt-6">
            <span className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/60">
              Password
            </span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-2 w-full px-0 py-2 bg-transparent border-b-2 border-navy text-xl font-display italic outline-none focus:border-tangerine"
            />
          </label>

          {err && (
            <div className="mt-4 bg-navy text-cream px-3 py-2 font-sans text-xs tracking-wider2 uppercase">
              <span className="text-tangerine">×</span> {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full py-4 bg-navy text-cream font-sans font-bold text-sm tracking-widest2 uppercase shadow-offsetTangerine active:translate-x-1 active:translate-y-1 active:shadow-none transition disabled:opacity-50 disabled:shadow-none"
          >
            Enter Control →
          </button>
        </div>
      </form>
    </main>
  );
}
