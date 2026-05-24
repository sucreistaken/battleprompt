'use client';

import { useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';

export function JoinForm({ subtitle }: { subtitle?: string }) {
  const { joinGame } = useGameState();
  const { t } = useI18n();
  const [nick, setNick] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await joinGame(nick.trim());
    setBusy(false);
    if (!r.ok) {
      const map: Record<string, string> = {
        too_short: 'Nickname too short',
        too_long: 'Nickname too long (max 20)',
        invalid_chars: 'Invalid characters',
        profane: 'Pick a different nickname',
        already_player_a: 'You are already Player A',
        match_in_progress: 'Match in progress — wait as audience'
      };
      setErr(map[r.reason || ''] || r.reason || 'Error');
    }
  }

  return (
    <main className="relative min-h-screen bg-cream text-navy flex flex-col">
      {/* Top bar */}
      <header className="px-5 pt-6 flex items-center justify-between">
        <div className="font-display italic font-black text-lg">PROMPT CLASH</div>
        <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
          <span className="live-dot" />
          LIVE
        </div>
      </header>

      {/* Tangerine diagonal banner */}
      <div className="relative mt-6 bg-tangerine px-5 py-8 overflow-hidden">
        <div className="font-sans font-bold text-[11px] tracking-widest3 uppercase text-navy">
          01 · NEW PLAYER
        </div>
        <h1 className="mt-3 font-display italic font-black text-navy text-5xl leading-[0.9] tracking-tight">
          Step into
          <br />
          the arena.
        </h1>
        {subtitle && (
          <div className="mt-4 font-display italic text-xl text-navy/80">{subtitle}</div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={submit} className="px-5 mt-8 flex flex-col gap-5 flex-1">
        <div>
          <label className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/70">
            Nickname
          </label>
          <div className="relative mt-2">
            <input
              autoFocus
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="@your_handle"
              maxLength={20}
              className="w-full px-0 py-3 bg-transparent border-b-2 border-navy text-2xl font-display italic text-navy outline-none focus:border-tangerine"
            />
            <span className="absolute right-0 bottom-3 font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/40">
              {nick.length}/20
            </span>
          </div>
        </div>

        {err && (
          <div className="bg-navy text-cream px-4 py-2.5 font-sans text-xs tracking-wider2 uppercase">
            <span className="text-tangerine">×</span> {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !nick.trim()}
          className="relative mt-2 w-full py-5 bg-navy text-cream font-sans font-bold text-base tracking-widest2 uppercase shadow-offsetTangerine active:translate-x-1 active:translate-y-1 active:shadow-none transition disabled:opacity-40 disabled:shadow-none"
        >
          Enter the Arena →
        </button>

        <div className="mt-auto pt-8 pb-6 text-center font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/40">
          QR-scanned · no signup · 60 second duel
        </div>
      </form>
    </main>
  );
}
