'use client';

/**
 * Sahne sesi — Web Audio ile kendi içinde üretilen ambient drone + faz geçiş efektleri.
 * Tarayıcı autoplay politikası gereği operatör bir kez "Sesi Aç"a basar (projeksiyon).
 * Harici ses dosyası gerekmez. İstenirse public/sounds/ambient.mp3 eklenip kullanılabilir.
 */

import { useEffect, useRef, useState } from 'react';

type Ctx = {
  ac: AudioContext;
  master: GainNode;
  ambient: { osc: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode };
};

function startAmbient(ac: AudioContext, master: GainNode): Ctx['ambient'] {
  const gain = ac.createGain();
  gain.gain.value = 0.0;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  gain.connect(lp).connect(master);

  // İki hafif detune sine → yavaş "beating", + bir oktav üstü yumuşak ton.
  const freqs = [110, 110.6, 220];
  const osc = freqs.map((f, i) => {
    const o = ac.createOscillator();
    o.type = i === 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.value = i === 2 ? 0.25 : 0.5;
    o.connect(g).connect(gain);
    o.start();
    return o;
  });

  // Yavaş swell (LFO).
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain).connect(gain.gain);
  lfo.start();

  // Yumuşak fade-in.
  gain.gain.setTargetAtTime(0.05, ac.currentTime, 1.5);
  return { osc, gain, lfo };
}

function blip(ac: AudioContext, master: GainNode, freq: number, dur: number, when: number, type: OscillatorType = 'sine', vol = 0.18) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g).connect(master);
  const t = ac.currentTime + when;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function phaseSfx(ac: AudioContext, master: GainNode, phase: string) {
  switch (phase) {
    case 'VS_INTRO':
      blip(ac, master, 440, 0.18, 0, 'square', 0.14);
      blip(ac, master, 660, 0.3, 0.16, 'square', 0.14);
      break;
    case 'PROMPTING':
      blip(ac, master, 520, 0.16, 0, 'triangle', 0.12);
      break;
    case 'GENERATING':
      blip(ac, master, 330, 0.2, 0, 'sine', 0.1);
      break;
    case 'SCORING':
      blip(ac, master, 700, 0.1, 0, 'square', 0.1);
      blip(ac, master, 700, 0.1, 0.18, 'square', 0.1);
      break;
    case 'RESULT':
      // küçük zafer akoru
      blip(ac, master, 523, 0.5, 0, 'triangle', 0.16);
      blip(ac, master, 659, 0.5, 0.08, 'triangle', 0.16);
      blip(ac, master, 784, 0.6, 0.16, 'triangle', 0.16);
      break;
    default:
      break;
  }
}

export function StageAudio({ phase }: { phase?: string }) {
  const ctxRef = useRef<Ctx | null>(null);
  const [on, setOn] = useState(false);
  const lastPhase = useRef<string | null>(null);

  const enable = async () => {
    if (ctxRef.current) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      await ac.resume();
      const master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
      const ambient = startAmbient(ac, master);
      ctxRef.current = { ac, master, ambient };
      setOn(true);
    } catch {
      /* ses açılamadı; sessiz devam */
    }
  };

  // Faz değişiminde efekt çal.
  useEffect(() => {
    if (!on || !ctxRef.current || !phase) return;
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;
    phaseSfx(ctxRef.current.ac, ctxRef.current.master, phase);
  }, [phase, on]);

  // Unmount temizliği.
  useEffect(() => {
    return () => {
      ctxRef.current?.ac.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  if (on) return null;

  return (
    <button
      onClick={enable}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        padding: '8px 14px',
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#fff',
        background: 'rgba(20,18,28,0.8)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 6,
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
      }}
      aria-label="Sesi aç"
    >
      🔊 Sesi aç
    </button>
  );
}
