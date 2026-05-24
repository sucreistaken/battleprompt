'use client';

import { motion } from 'framer-motion';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageFrame, TopBar, PixelText, LetterCascade, Lbl, C, FONT } from './atmosphere';

/** Silkscreen advances are wide; scale the name down so long nicknames fit. */
function nameSize(len: number) {
  return Math.max(48, Math.min(190, Math.floor(1500 / Math.max(3, len))));
}

const EASE_IN: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

/**
 * VS_INTRO - ALICE / VS / BOB stacked, per-player jersey bars under names.
 */
export function StageVS() {
  const { state } = useGameState();
  const { t } = useI18n();
  if (!state) return null;

  const nameA = (state.players.A?.nickname ?? t('opponent')).toUpperCase();
  const nameB = (state.players.B?.nickname ?? t('opponent')).toUpperCase();
  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state.theme} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '0 80px',
        }}
      >
        {/* A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <LetterCascade text={nameA} size={nameSize(nameA.length)} gap={6} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_IN, delay: 0.26 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <span style={{ width: 56, height: 6, background: C.aColor }} />
            <span style={{ fontFamily: FONT.pixel, fontSize: 18, letterSpacing: '0.12em', color: C.aColor }}>
              {t('playerLabel')} A
            </span>
          </motion.div>
        </div>

        {/* VS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: EASE_BACK, delay: 0.34 }}
          style={{ display: 'flex', alignItems: 'center', gap: 28, margin: '20px 0' }}
        >
          <span style={{ width: 140, height: 2, background: C.aColor, opacity: 0.6 }} />
          <PixelText size={120}>{t('vs')}</PixelText>
          <span style={{ width: 140, height: 2, background: C.bColor, opacity: 0.6 }} />
        </motion.div>

        {/* B */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_IN, delay: 0.52 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <span style={{ fontFamily: FONT.pixel, fontSize: 18, letterSpacing: '0.12em', color: C.bColor }}>
              {t('playerLabel')} B
            </span>
            <span style={{ width: 56, height: 6, background: C.bColor }} />
          </motion.div>
          <LetterCascade text={nameB} size={nameSize(nameB.length)} gap={6} baseDelay={0.6} />
        </div>
      </div>

      {/* Theme */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Lbl size={11} color="text3">
          {t('theme')}
        </Lbl>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 24,
            fontWeight: 500,
            fontStyle: 'italic',
            color: C.bone,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: 1100,
          }}
        >
          &ldquo;{state.theme}&rdquo;
        </div>
      </div>
    </StageFrame>
  );
}
