'use client';

import { useGameState } from '@/components/client/useGameState';
import { SettingsForm } from './SettingsForm';
import { MatchHistory } from './MatchHistory';

export function AdminPanel() {
  const { state, socket } = useGameState();

  function reset() {
    if (!confirm('Reset current match?')) return;
    socket?.emit('admin:reset_match');
  }
  function forceEnd() {
    if (!confirm('Force-end the current match?')) return;
    socket?.emit('admin:force_end');
  }
  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    location.reload();
  }

  const matchNo = state?.matchId?.slice(-3).toUpperCase() || '—';

  return (
    <main className="min-h-screen bg-cream text-navy">
      {/* Header bar */}
      <header className="bg-navy text-cream px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
            <span className="live-dot" />
            CONTROL ROOM
          </span>
          <span className="font-display italic font-black text-base">PROMPT CLASH</span>
        </div>
        <button
          onClick={logout}
          className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60 hover:text-cream"
        >
          Sign out
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
        {/* Status strip */}
        <section className="border-2 border-navy bg-cream">
          <div className="bg-navy text-cream px-4 py-2 font-sans font-bold text-[10px] tracking-widest3 uppercase">
            Live State
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Phase" value={state?.phase || '—'} />
            <Stat label="Match" value={`#${matchNo}`} />
            <Stat
              label="Player A"
              value={state?.players.A?.nickname || '—'}
            />
            <Stat
              label="Player B"
              value={state?.players.B?.nickname || '—'}
            />
          </div>
          <div className="border-t-2 border-navy p-4 flex flex-wrap gap-3">
            <button
              onClick={forceEnd}
              disabled={!state || state.phase === 'IDLE'}
              className="bg-tangerine text-navy px-4 py-2 font-sans font-bold text-xs tracking-widest2 uppercase shadow-offsetNavy active:translate-x-1 active:translate-y-1 active:shadow-none transition disabled:opacity-40 disabled:shadow-none"
            >
              Force End
            </button>
            <button
              onClick={reset}
              className="bg-cream-deep border-2 border-navy text-navy px-4 py-2 font-sans font-bold text-xs tracking-widest2 uppercase active:translate-x-0.5 active:translate-y-0.5 transition"
            >
              Reset Match
            </button>
          </div>
        </section>

        <SettingsForm />
        <MatchHistory />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/50">
        {label}
      </div>
      <div className="mt-1 font-display italic font-bold text-xl text-navy truncate">
        {value}
      </div>
    </div>
  );
}
