'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/components/client/useGameState';

export function SettingsForm() {
  const { state, socket } = useGameState();
  const [draft, setDraft] = useState({
    theme: '',
    winnerMode: 'AI_SCORE' as 'AI_SCORE' | 'AUDIENCE_VOTE',
    showLivePrompts: true,
    promptDurationSec: 60,
    votingDurationSec: 15,
    tiebreakDurationSec: 10,
    resultDurationSec: 15,
    vsIntroDurationSec: 5,
    stageLanguage: 'tr' as 'tr' | 'en'
  });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!state) return;
    setDraft({
      theme: state.theme,
      winnerMode: state.winnerMode,
      showLivePrompts: state.showLivePrompts,
      promptDurationSec: state.durations.promptDurationSec,
      votingDurationSec: state.durations.votingDurationSec,
      tiebreakDurationSec: state.durations.tiebreakDurationSec,
      resultDurationSec: state.durations.resultDurationSec,
      vsIntroDurationSec: state.durations.vsIntroDurationSec,
      stageLanguage: state.stageLanguage
    });
  }, [state?.matchId, state?.phase]);

  if (!state) return null;

  function update<K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function save() {
    if (!socket) return;
    socket.emit('admin:update_settings', draft, (res: any) => {
      if (res?.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    });
  }

  return (
    <section className="border-2 border-navy bg-cream">
      <div className="bg-navy text-cream px-4 py-2 font-sans font-bold text-[10px] tracking-widest3 uppercase">
        Settings
      </div>
      <div className="p-4 flex flex-col gap-5">
        <Field label="Theme">
          <input
            value={draft.theme}
            onChange={(e) => update('theme', e.target.value)}
            className="w-full px-3 py-2 bg-cream-deep border-2 border-navy/20 focus:border-tangerine outline-none font-sans"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Winner Mode">
            <select
              value={draft.winnerMode}
              onChange={(e) => update('winnerMode', e.target.value as any)}
              className="w-full px-3 py-2 bg-cream-deep border-2 border-navy/20 outline-none font-sans font-bold uppercase text-sm"
            >
              <option value="AI_SCORE">AI Score</option>
              <option value="AUDIENCE_VOTE">Audience Vote</option>
            </select>
          </Field>
          <Field label="Stage Language">
            <select
              value={draft.stageLanguage}
              onChange={(e) => update('stageLanguage', e.target.value as any)}
              className="w-full px-3 py-2 bg-cream-deep border-2 border-navy/20 outline-none font-sans font-bold uppercase text-sm"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.showLivePrompts}
            onChange={(e) => update('showLivePrompts', e.target.checked)}
            className="w-5 h-5 accent-tangerine"
          />
          <span className="font-sans font-bold text-sm tracking-wider2 uppercase">
            Show Live Prompts
          </span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Prompt duration (s)"
            value={draft.promptDurationSec}
            onChange={(v) => update('promptDurationSec', v)}
            min={10}
            max={300}
          />
          <NumberInput
            label="Voting duration (s)"
            value={draft.votingDurationSec}
            onChange={(v) => update('votingDurationSec', v)}
            min={5}
            max={120}
          />
        </div>

        <button
          onClick={save}
          className="w-full py-3 bg-navy text-cream font-sans font-bold text-sm tracking-widest2 uppercase shadow-offsetTangerine active:translate-x-1 active:translate-y-1 active:shadow-none transition"
        >
          {savedFlash ? '✓ Saved' : 'Save Settings →'}
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, Number(e.target.value))))
        }
        className="w-full px-3 py-2 bg-cream-deep border-2 border-navy/20 focus:border-tangerine outline-none font-display italic font-bold text-lg tabular-nums"
      />
    </Field>
  );
}
