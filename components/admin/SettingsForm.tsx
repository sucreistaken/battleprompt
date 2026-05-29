'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/client/i18nContext';
import type { WinnerMode } from '@/types/game';
import { cn } from '@/lib/utils';

interface SettingsShape {
  winnerMode: WinnerMode;
  showLivePrompts: boolean;
  promptDurationSec: number;
  votingDurationSec: number;
  stageLanguage: 'tr' | 'en';
  stageTheme: 'dark' | 'light';
  lockedCategory: string;
  lockedDifficulty: string;
}

interface Option {
  code: string;
  label: string;
}

const DEFAULTS: SettingsShape = {
  winnerMode: 'AI_SCORE',
  showLivePrompts: true,
  promptDurationSec: 30,
  votingDurationSec: 20,
  stageLanguage: 'tr',
  stageTheme: 'dark',
  lockedCategory: '',
  lockedDifficulty: '',
};

export function SettingsForm() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [categories, setCategories] = useState<Option[]>([]);
  const [difficulties, setDifficulties] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState<'reset' | 'force' | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setSettings({ ...DEFAULTS, ...d.settings });
        if (Array.isArray(d?.categories)) setCategories(d.categories);
        if (Array.isArray(d?.difficulties)) setDifficulties(d.difficulties);
      })
      .catch(() => {});
  }, []);

  const update = <K extends keyof SettingsShape>(k: K, v: SettingsShape[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedAt(Date.now());
        setTimeout(() => setSavedAt(null), 2400);
      }
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  };

  const matchAction = async (action: 'reset' | 'force') => {
    setBusy(action);
    try {
      await fetch(`/api/admin/match/${action}`, { method: 'POST' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Live prompts toggle */}
      <Section label={t('showLivePrompts')}>
        <Toggle
          checked={settings.showLivePrompts}
          onChange={(v) => update('showLivePrompts', v)}
          label={settings.showLivePrompts ? t('toggleOn') : t('toggleOff')}
        />
      </Section>

      {/* Durations */}
      <div className="grid grid-cols-2 gap-4">
        <Section label={t('promptDuration')}>
          <NumberField
            value={settings.promptDurationSec}
            onChange={(v) => update('promptDurationSec', v)}
            min={10}
            max={120}
            decreaseLabel={t('decreaseLabel')}
            increaseLabel={t('increaseLabel')}
          />
        </Section>
        <Section label={t('votingDuration')}>
          <NumberField
            value={settings.votingDurationSec}
            onChange={(v) => update('votingDurationSec', v)}
            min={5}
            max={60}
            decreaseLabel={t('decreaseLabel')}
            increaseLabel={t('increaseLabel')}
          />
        </Section>
      </div>

      {/* Stage language */}
      <Section label={t('stageLanguage')}>
        <div className="inline-flex rounded-full bg-surface-low p-1 gap-1">
          {(['tr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => update('stageLanguage', l)}
              aria-pressed={settings.stageLanguage === l}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-colors',
                settings.stageLanguage === l
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-variant',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      {/* Stage theme (dark / light) — synced to every device via state */}
      <Section label={t('stageTheme')}>
        <div className="inline-flex rounded-full bg-surface-low p-1 gap-1">
          {(['dark', 'light'] as const).map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => update('stageTheme', th)}
              aria-pressed={settings.stageTheme === th}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-colors',
                settings.stageTheme === th
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-variant',
              )}
            >
              {th === 'dark' ? t('themeDark') : t('themeLight')}
            </button>
          ))}
        </div>
      </Section>

      {/* Hedef kategori + zorluk kilidi (boş = otomatik rastgele) */}
      <div className="grid grid-cols-2 gap-4">
        <Section label={t('categorySetting')}>
          <select
            value={settings.lockedCategory}
            onChange={(e) => update('lockedCategory', e.target.value)}
            className="q-field"
          >
            <option value="">{t('autoOption')}</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Section>
        <Section label={t('difficultySetting')}>
          <select
            value={settings.lockedDifficulty}
            onChange={(e) => update('lockedDifficulty', e.target.value)}
            className="q-field"
          >
            <option value="">{t('autoOption')}</option>
            {difficulties.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </Section>
      </div>

      {/* Save + actions */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="q-cta"
        >
          {saving ? '…' : savedAt ? t('saved') : t('save')}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => matchAction('reset')}
            disabled={busy === 'reset'}
            className="q-cta q-cta-ghost"
          >
            {busy === 'reset' ? '…' : t('resetMatch')}
          </button>
          <button
            type="button"
            onClick={() => matchAction('force')}
            disabled={busy === 'force'}
            className="q-cta q-cta-danger"
          >
            {busy === 'force' ? '…' : t('forceEnd')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="q-label mb-3 block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-surface-container',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
      <span className="text-sm text-ink">{label}</span>
    </button>
  );
}

function NumberField({
  value,
  onChange,
  min,
  max,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 5))}
        className="w-10 h-10 rounded-full bg-surface-container hover:bg-primary-50 text-ink-variant font-bold"
        aria-label={decreaseLabel}
      >
        −
      </button>
      <span className="q-display w-16 text-center text-2xl text-ink tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 5))}
        className="w-10 h-10 rounded-full bg-surface-container hover:bg-primary-50 text-ink-variant font-bold"
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  );
}
