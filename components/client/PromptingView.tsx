'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { CountdownTimer } from './CountdownTimer';

const TYPING_THROTTLE_MS = 200;

export function PromptingView() {
  const { state, mySlot, livePrompts, sendTyping, submitPrompt } = useGameState();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const lastSent = useRef(0);

  useEffect(() => {
    if (state?.phase === 'PROMPTING') setSubmitted(false);
  }, [state?.phase]);

  useEffect(() => {
    if (!state) return;
    if (state.phase !== 'PROMPTING' && state.phase !== 'IDLE') setSubmitted(true);
  }, [state?.phase]);

  if (!state || !mySlot) return null;
  const opponentSlot = mySlot === 'A' ? 'B' : 'A';
  const opponent = state.players[opponentSlot];
  const opponentText = state.showLivePrompts ? livePrompts[opponentSlot] : '';
  const myColor = mySlot === 'A' ? 'tangerine' : 'navy';

  function onChange(v: string) {
    if (submitted) return;
    setText(v);
    const now = Date.now();
    if (now - lastSent.current > TYPING_THROTTLE_MS) {
      lastSent.current = now;
      sendTyping(v);
    }
  }
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;
    setSubmitted(true);
    submitPrompt(text);
  }

  return (
    <main className="min-h-screen bg-cream text-navy flex flex-col">
      {/* Top broadcast strip */}
      <header className="bg-navy text-cream px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
            <span className="live-dot" />
            LIVE
          </div>
          <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60">
            {mySlot === 'A' ? '01' : '02'} · YOU
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            className="font-display italic font-black text-3xl tabular-nums text-tangerine"
          />
          <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60">
            sec
          </span>
        </div>
      </header>

      {/* Reference image */}
      <section className="px-4 pt-4">
        <div className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/50 mb-2 flex items-center justify-between">
          <span>Reference Image</span>
          <span className="text-navy/30">{(state.theme || '').toUpperCase().slice(0, 30)}</span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-navy" />
          <div className="relative w-full aspect-square bg-navy overflow-hidden">
            {state.referenceImageUrl ? (
              <img
                src={state.referenceImageUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-cream/30 font-display italic">
                awaiting…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Opponent live */}
      {state.showLivePrompts && (
        <section className="px-4 mt-4">
          <div className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/50 mb-1 flex items-center justify-between">
            <span>
              {opponentSlot === 'A' ? '01' : '02'} · {opponent?.nickname || 'OPPONENT'}
            </span>
            <span className={opponent?.submitted ? 'text-tangerine' : 'text-navy/30'}>
              {opponent?.submitted ? '✓ SENT' : opponent?.disconnected ? 'DROPPED' : 'TYPING…'}
            </span>
          </div>
          <div className="border-l-4 border-navy/30 pl-3 py-1 min-h-[3rem] font-display italic text-base text-navy/70">
            {opponentText ? `"${opponentText}"` : <span className="text-navy/30">…</span>}
          </div>
        </section>
      )}

      {/* My prompt */}
      <form onSubmit={onSubmit} className="px-4 mt-4 flex-1 flex flex-col pb-6">
        <div className={`font-sans font-bold text-[10px] tracking-widest3 uppercase ${myColor === 'tangerine' ? 'text-tangerine' : 'text-navy'} mb-2`}>
          Your Prompt
        </div>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="describe the image…"
          disabled={submitted}
          maxLength={500}
          autoFocus
          className={`w-full min-h-[140px] p-4 bg-cream-deep border-2 ${myColor === 'tangerine' ? 'border-tangerine' : 'border-navy'} outline-none focus:bg-cream font-display italic text-lg text-navy resize-none disabled:opacity-50`}
        />
        <div className="mt-1 text-right font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/40">
          {text.length}/500
        </div>

        <button
          type="submit"
          disabled={submitted || !text.trim()}
          className={`mt-4 w-full py-5 ${myColor === 'tangerine' ? 'bg-tangerine text-navy shadow-offsetNavy' : 'bg-navy text-cream shadow-offsetTangerine'} font-sans font-bold text-base tracking-widest2 uppercase active:translate-x-1 active:translate-y-1 active:shadow-none transition disabled:opacity-40 disabled:shadow-none`}
        >
          {submitted ? '✓ Submitted' : 'Lock In →'}
        </button>
      </form>
    </main>
  );
}
