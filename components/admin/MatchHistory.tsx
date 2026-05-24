'use client';

import { useEffect, useState } from 'react';

interface MatchRow {
  _id: string;
  startedAt: string;
  theme: string;
  winnerMode: 'AI_SCORE' | 'AUDIENCE_VOTE';
  playerA?: { nickname?: string; imageUrl?: string };
  playerB?: { nickname?: string; imageUrl?: string };
  winner?: 'A' | 'B' | 'TIE';
}

export function MatchHistory() {
  const [rows, setRows] = useState<MatchRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/admin/matches');
        if (!r.ok) return;
        const body = await r.json();
        if (!cancelled) setRows(body.matches || []);
      } catch {}
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="border-2 border-navy bg-cream">
      <div className="bg-navy text-cream px-4 py-2 font-sans font-bold text-[10px] tracking-widest3 uppercase">
        Match History · last 20
      </div>
      <div className="max-h-96 overflow-auto no-scrollbar">
        {!rows && <div className="p-4 font-display italic text-sm text-navy/40">…</div>}
        {rows && rows.length === 0 && (
          <div className="p-4 font-display italic text-sm text-navy/40">
            no matches yet
          </div>
        )}
        {rows?.map((m, i) => (
          <a
            key={m._id}
            href={m.playerA?.imageUrl || m.playerB?.imageUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-cream' : 'bg-cream-deep'} hover:bg-cream-dim border-b border-navy/10 last:border-b-0`}
          >
            <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/40 w-20 shrink-0 tabular-nums">
              {new Date(m.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="truncate flex-1 font-display italic text-base">
              <span className="text-tangerine font-bold">{m.playerA?.nickname || '?'}</span>
              <span className="text-navy/30 mx-2 not-italic font-sans text-xs">vs</span>
              <span className="text-navy font-bold">{m.playerB?.nickname || '?'}</span>
            </span>
            <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase">
              {m.winner === 'TIE' ? (
                <span className="text-navy/50">DRAW</span>
              ) : m.winner ? (
                <span className="text-tangerine">
                  ★ {m.winner === 'A' ? m.playerA?.nickname : m.playerB?.nickname}
                </span>
              ) : (
                ''
              )}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
